import { verifyEmailSchema } from "@/lib/validators/email";
import { verifyEmailWithToken } from "@/lib/auth/verification";
import { toPublicUser } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError, isAuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";

export const POST = withAuthRoute(
  async (request) => {
    const body = await request.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      throw new AuthError("Token is required", 400, "validation_error");
    }

    try {
      const user = await verifyEmailWithToken(parsed.data.token);
      await logAudit({
        action: "email.verify.success",
        request,
        success: true,
        userId: user._id.toString(),
        email: user.email,
      });
      return jsonOk({
        success: true,
        user: toPublicUser(user),
        message: "Email verified. You can sign in now.",
      });
    } catch (err) {
      await logAudit({
        action: "email.verify.failed",
        request,
        success: false,
        meta: { code: isAuthError(err) ? err.code : "unknown" },
      });
      throw err;
    }
  },
  { rateLimit: "auth_action" }
);
