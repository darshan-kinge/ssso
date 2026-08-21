import { headers } from "next/headers";
import { getRefreshCookie, clearRefreshCookie } from "@/lib/auth/cookies";
import { rotateSession, rotateEndUserSession } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError, isAuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { HEADER_PLANE } from "@/lib/workspace/headers";

export const POST = withAuthRoute(
  async (request) => {
    const h = await headers();
    const plane = h.get(HEADER_PLANE);
    const useTenant =
      isMultiTenantEnabled() && plane === "tenant";

    const refreshToken = await getRefreshCookie(
      useTenant ? "end_user" : "platform"
    );

    if (!refreshToken) {
      throw new AuthError("No refresh session", 401, "no_session");
    }

    try {
      const result = useTenant
        ? await rotateEndUserSession(refreshToken)
        : await rotateSession(refreshToken);
      await logAudit({
        action: "refresh.success",
        request,
        success: true,
        userId: result.user.id,
        email: result.user.email,
      });
      return jsonOk(result);
    } catch (err) {
      await clearRefreshCookie(useTenant ? "end_user" : "platform");
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
