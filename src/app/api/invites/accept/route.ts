import { getAuthenticatedPlatformUser } from "@/lib/auth/request";
import { acceptWorkspaceInvite } from "@/lib/workspace/invites";
import { assertWorkspaceCollaborationEnabled } from "@/lib/workspace/guard";
import { acceptInviteSchema } from "@/lib/validators/workspace";
import { createSession, toPublicUser } from "@/lib/auth/session";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { getDeviceLabel } from "@/lib/auth/request";
import { getMembership } from "@/lib/workspace/service";
import { logAudit } from "@/lib/security/audit";

export async function POST(request: Request) {
  try {
    assertWorkspaceCollaborationEnabled();
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const body = await request.json();
    const parsed = acceptInviteSchema.safeParse(body);
    if (!parsed.success) {
      throw new AuthError(
        parsed.error.errors[0]?.message ?? "Invalid input",
        400,
        "validation_error"
      );
    }

    const { user } = await getAuthenticatedPlatformUser(
      request.headers.get("authorization")
    );

    const result = await acceptWorkspaceInvite(parsed.data.token, user._id.toString());

    await logAudit({
      action: "workspace.invite.accept",
      request,
      success: true,
      userId: user._id.toString(),
      email: user.email,
      workspaceId: result.workspaceId,
      meta: {
        role: result.role,
        alreadyMember: result.alreadyMember,
      },
    });

    const membership = await getMembership(
      user._id.toString(),
      result.workspaceId
    );

    const device = await getDeviceLabel();
    const { accessToken } = await createSession(user, device, {
      workspaceId: result.workspaceId,
      role: membership?.role ?? result.role,
    });

    return jsonOk({
      ...result,
      accessToken,
      user: toPublicUser(user),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
