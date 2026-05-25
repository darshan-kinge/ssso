import { getRefreshCookie, clearRefreshCookie } from "@/lib/auth/cookies";
import { rotateSession } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError, isAuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";

export const POST = withAuthRoute(
  async (request) => {
    const refreshToken = await getRefreshCookie();

    if (!refreshToken) {
      throw new AuthError("No refresh session", 401, "no_session");
    }

    try {
      const result = await rotateSession(refreshToken);
      await logAudit({
        action: "refresh.success",
        request,
        success: true,
        userId: result.user.id,
        email: result.user.email,
      });
      return jsonOk(result);
    } catch (err) {
      await clearRefreshCookie();
      if (isAuthError(err)) {
        await logAudit({
          action: "refresh.failed",
          request,
          success: false,
          meta: { code: err.code },
        });
      }
      throw err;
    }
  },
  { rateLimit: "refresh" }
);
