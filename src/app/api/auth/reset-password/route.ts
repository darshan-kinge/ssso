import { resetPasswordSchema } from "@/lib/validators/email";
import { resetPasswordWithToken } from "@/lib/auth/password-reset";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError, isAuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";

export const POST = withAuthRoute(
  async (request) => {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      throw new AuthError(
        parsed.error.errors[0]?.message ?? "Invalid input",
        400,
        "validation_error"
      );
    }

    try {
      await resetPasswordWithToken(parsed.data.token, parsed.data.password);
      await logAudit({
        action: "password.reset.success",
        request,
        success: true,
      });
      return jsonOk({
        success: true,
        message: "Password updated. You can sign in with your new password.",
      });
    } catch (err) {
      await logAudit({
        action: "password.reset.failed",
        request,
        success: false,
        meta: { code: isAuthError(err) ? err.code : "unknown" },
      });
      throw err;
    }
  },
  { rateLimit: "auth_action" }
);
