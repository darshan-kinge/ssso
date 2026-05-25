import { NextResponse } from "next/server";
import { tokenRequestSchema } from "@/lib/validators/oauth";
import { exchangeAuthorizationCode } from "@/lib/oauth/token";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError, isAuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";
import {
  applyCorsHeaders,
  corsOriginForClient,
  isAllowedCorsOrigin,
} from "@/lib/security/cors";

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin || !(await isAllowedCorsOrigin(origin))) {
    return new NextResponse(null, { status: 204 });
  }
  return applyCorsHeaders(new NextResponse(null, { status: 204 }), origin);
}

export const POST = withAuthRoute(
  async (request) => {
    const body = await request.json();
    const parsed = tokenRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new AuthError(
        parsed.error.errors[0]?.message ?? "Invalid token request",
        400,
        "invalid_request"
      );
    }

    const corsOrigin = await corsOriginForClient(
      request,
      parsed.data.client_id
    );

    try {
      const result = await exchangeAuthorizationCode(parsed.data);
      await logAudit({
        action: "oauth.token.success",
        request,
        success: true,
        userId: result.user.id,
        email: result.user.email,
        meta: {
          clientId: parsed.data.client_id,
          pkce: Boolean(parsed.data.code_verifier),
        },
      });
      return applyCorsHeaders(jsonOk(result), corsOrigin);
    } catch (err) {
      await logAudit({
        action: "oauth.token.failed",
        request,
        success: false,
        meta: {
          clientId: parsed.data.client_id,
          code: isAuthError(err) ? err.code : "unknown",
        },
      });
      const res = handleApiError(err);
      return applyCorsHeaders(res, corsOrigin);
    }
  },
  { rateLimit: "oauth_token" }
);
