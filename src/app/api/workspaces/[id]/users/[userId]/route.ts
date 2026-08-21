import { getAuthenticatedPlatformUser } from "@/lib/auth/request";
import { requireMembership } from "@/lib/workspace/service";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { EndUser } from "@/lib/models/EndUser";
import { Session } from "@/lib/models/Session";
import { z } from "zod";

const patchSchema = z.object({
  disabled: z.boolean().optional(),
});

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { id: workspaceId, userId } = await context.params;
    const { user } = await getAuthenticatedPlatformUser(
      request.headers.get("authorization")
    );
    await requireMembership(user._id.toString(), workspaceId, "admin");

    const endUser = await EndUser.findOne({ _id: userId, workspaceId });
    if (!endUser) {
      throw new AuthError("User not found", 404, "not_found");
    }

    // Revoke all sessions for this end user in this workspace
    await Session.deleteMany({ userId: endUser._id, sessionType: "end_user" });
    await endUser.deleteOne();

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { id: workspaceId, userId } = await context.params;
    const { user } = await getAuthenticatedPlatformUser(
      request.headers.get("authorization")
    );
    await requireMembership(user._id.toString(), workspaceId, "admin");

    const endUser = await EndUser.findOne({ _id: userId, workspaceId });
    if (!endUser) {
      throw new AuthError("User not found", 404, "not_found");
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new AuthError(
        parsed.error.errors[0]?.message ?? "Invalid input",
        400,
        "validation_error"
      );
    }

    if (parsed.data.disabled !== undefined) {
      (endUser as typeof endUser & { disabled: boolean }).disabled = parsed.data.disabled;
    }

    // If disabling, also revoke all active sessions
    if (parsed.data.disabled === true) {
      await Session.deleteMany({ userId: endUser._id, sessionType: "end_user" });
    }

    await endUser.save();

    return jsonOk({
      user: {
        id: endUser._id.toString(),
        email: endUser.email,
        isVerified: endUser.isVerified,
        disabled: (endUser as typeof endUser & { disabled?: boolean }).disabled ?? false,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
