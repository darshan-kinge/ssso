import {
  getAuthenticatedUser,
  requireWorkspaceRole,
} from "@/lib/auth/request";
import { listAuditForUser, listAuditForWorkspace } from "@/lib/security/audit";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { isMultiTenantEnabled } from "@/lib/config/deployment";

export const GET = withAuthRoute(async (request) => {
  const auth = request.headers.get("authorization");

  if (isMultiTenantEnabled()) {
    const ctx = await requireWorkspaceRole(auth, "viewer");
    const events = await listAuditForWorkspace(ctx.workspaceId!, 40);
    return jsonOk({ events, workspaceId: ctx.workspaceId });
  }

  const { user } = await getAuthenticatedUser(auth);
  const events = await listAuditForUser(user._id.toString(), 40);
  return jsonOk({ events });
});
