import { requireWorkspaceRole } from "@/lib/auth/request";
import { listWorkspaceMembers } from "@/lib/workspace/members";
import { assertWorkspaceCollaborationEnabled } from "@/lib/workspace/guard";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertWorkspaceCollaborationEnabled();
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { id: workspaceId } = await context.params;
    await requireWorkspaceRole(
      request.headers.get("authorization"),
      "viewer",
      workspaceId
    );

    const members = await listWorkspaceMembers(workspaceId);
    const { listPendingInvites } = await import("@/lib/workspace/invites");
    const invites = await listPendingInvites(workspaceId);

    return jsonOk({ members, invites });
  } catch (err) {
    return handleApiError(err);
  }
}
