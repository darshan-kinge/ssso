import { headers } from "next/headers";
import { getRefreshCookie, clearRefreshCookie } from "@/lib/auth/cookies";
import { revokeSessionByRefreshToken } from "@/lib/auth/session";
import { Session } from "@/lib/models/Session";
import { User } from "@/lib/models/User";
import { EndUser } from "@/lib/models/EndUser";
import { hashRefreshToken } from "@/lib/auth/tokens";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { logAudit } from "@/lib/security/audit";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { HEADER_PLANE } from "@/lib/workspace/headers";

async function performLogout(request: Request) {
  const h = await headers();
  const plane = h.get(HEADER_PLANE);
  const useTenant = isMultiTenantEnabled() && plane === "tenant";

  const refreshToken = await getRefreshCookie(
    useTenant ? "end_user" : "platform"
  );

  let userId: string | undefined;
  let email: string | undefined;

  if (refreshToken) {
    const { refreshPepper } = requireAuthSecrets();
    const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);

    // Find the session before revoking it
    const session = await Session.findOne({
      refreshTokenHash,
      sessionType: useTenant ? "end_user" : "platform",
    });

    if (session) {
      userId = session.userId.toString();

      // Fetch user email to enrich audit logs
      if (useTenant) {
        const endUser = await EndUser.findById(session.userId);
        email = endUser?.email;
      } else {
        const platformUser = await User.findById(session.userId);
        email = platformUser?.email;
      }

      await revokeSessionByRefreshToken(
        refreshToken,
        useTenant ? "end_user" : "platform"
      );
    }
  }

  await clearRefreshCookie(useTenant ? "end_user" : "platform");

  await logAudit({
    action: "logout",
    request,
    success: true,
    userId,
    email,
  });
}

export const POST = withAuthRoute(async (request) => {
  await performLogout(request);
  return jsonOk({ success: true });
});

export const GET = withAuthRoute(async (request) => {
  await performLogout(request);
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get("redirect_uri");

  if (redirectUri) {
    return Response.redirect(redirectUri, 302);
  }

  return Response.redirect(new URL("/", request.url).toString(), 302);
});

