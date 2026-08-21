import { getAuthenticatedPlatformUser } from "@/lib/auth/request";
import { requireMembership } from "@/lib/workspace/service";
import { createSession, toPublicUser } from "@/lib/auth/session";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { getDeviceLabel } from "@/lib/auth/request";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { user } = await getAuthenticatedPlatformUser(
      request.headers.get("authorization")
    );
    const { id: workspaceId } = await context.params;

    const membership = await requireMembership(
      user._id.toString(),
      workspaceId,
      "viewer"
    );

    const device = await getDeviceLabel();
    const { accessToken } = await createSession(user, device, {
      workspaceId,
      role: membership.role,
    });

    return jsonOk({
      accessToken,
      workspaceId,
      role: membership.role,
      user: toPublicUser(user),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
