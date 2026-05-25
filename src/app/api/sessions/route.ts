import { getAuthenticatedUser } from "@/lib/auth/request";
import { listSessionsForUser } from "@/lib/auth/sessions-mgmt";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";

export const GET = withAuthRoute(async (request) => {
  const { user } = await getAuthenticatedUser(
    request.headers.get("authorization")
  );

  const result = await listSessionsForUser(user._id.toString());
  return jsonOk(result);
});
