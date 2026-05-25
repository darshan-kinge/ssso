import { getRefreshCookie, clearRefreshCookie } from "@/lib/auth/cookies";
import { revokeSessionByRefreshToken } from "@/lib/auth/session";
import { getUserFromRefreshCookie } from "@/lib/oauth/session-user";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { logAudit } from "@/lib/security/audit";

export const POST = withAuthRoute(async (request) => {
  const user = await getUserFromRefreshCookie();
  const refreshToken = await getRefreshCookie();

  if (refreshToken) {
    await revokeSessionByRefreshToken(refreshToken);
  }

  await clearRefreshCookie();

  await logAudit({
    action: "logout",
    request,
    success: true,
    userId: user?._id.toString(),
    email: user?.email,
  });

  return jsonOk({ success: true });
});
