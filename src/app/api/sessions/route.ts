import {
  getAuthenticatedUser,
  requireWorkspaceRole,
} from "@/lib/auth/request";
import { listSessionsForUser } from "@/lib/auth/sessions-mgmt";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { isMultiTenantEnabled } from "@/lib/config/deployment";

export const GET = withAuthRoute(async (request) => {
  const auth = request.headers.get("authorization");

  if (isMultiTenantEnabled()) {
    const ctx = await requireWorkspaceRole(auth, "viewer");
    const result = await listSessionsForUser(
      ctx.user._id.toString(),
      ctx.workspaceId!
    );
    return jsonOk({ ...result, workspaceId: ctx.workspaceId });
  }

  const { user } = await getAuthenticatedUser(auth);
  const result = await listSessionsForUser(user._id.toString());
  return jsonOk(result);
});
