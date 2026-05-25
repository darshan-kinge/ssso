import { getAuthenticatedUser } from "@/lib/auth/request";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";

export const GET = withAuthRoute(async (request) => {
  const { publicUser } = await getAuthenticatedUser(
    request.headers.get("authorization")
  );

  return jsonOk({ user: publicUser });
});
