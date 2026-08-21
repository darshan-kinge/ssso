import {
  getAuthenticatedUser,
  requireWorkspaceRole,
} from "@/lib/auth/request";
import { revokeSessionForUser } from "@/lib/auth/sessions-mgmt";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";
import { isMultiTenantEnabled } from "@/lib/config/deployment";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const auth = request.headers.get("authorization");
    const { id } = await context.params;

    let userId: string;
    let workspaceId: string | undefined;
    let email: string;

    if (isMultiTenantEnabled()) {
      const ctx = await requireWorkspaceRole(auth, "viewer");
      userId = ctx.user._id.toString();
      workspaceId = ctx.workspaceId!;
      email = ctx.user.email;
    } else {
      const { user } = await getAuthenticatedUser(auth);
      userId = user._id.toString();
      email = user.email;
    }

    const result = await revokeSessionForUser(userId, id, workspaceId);

    await logAudit({
      action: "session.revoke",
      request,
      success: true,
      userId,
      email,
      workspaceId,
      meta: { sessionId: id, revokedCurrent: result.revokedCurrent },
    });

    return jsonOk({ success: true, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
