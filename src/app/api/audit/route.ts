import { getAuthenticatedUser } from "@/lib/auth/request";
import { listAuditForUser } from "@/lib/security/audit";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";

export const GET = withAuthRoute(async (request) => {
  const { user } = await getAuthenticatedUser(
    request.headers.get("authorization")
  );

  const events = await listAuditForUser(user._id.toString(), 40);

  return jsonOk({ events });
});
