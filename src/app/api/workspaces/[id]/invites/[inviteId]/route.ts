import { requireWorkspaceRole } from "@/lib/auth/request";
import { revokeWorkspaceInvite } from "@/lib/workspace/invites";
import { assertWorkspaceCollaborationEnabled } from "@/lib/workspace/guard";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    assertWorkspaceCollaborationEnabled();
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { id: workspaceId, inviteId } = await context.params;
    const ctx = await requireWorkspaceRole(
      request.headers.get("authorization"),
      "admin",
      workspaceId
    );

    await revokeWorkspaceInvite(
      workspaceId,
      ctx.user._id.toString(),
      inviteId
    );

    await logAudit({
      action: "workspace.invite.revoke",
      request,
      success: true,
      userId: ctx.user._id.toString(),
      workspaceId,
      meta: { inviteId },
    });

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
