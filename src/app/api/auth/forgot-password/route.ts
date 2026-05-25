import { emailOnlySchema } from "@/lib/validators/email";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";

export const POST = withAuthRoute(
  async (request) => {
    const body = await request.json();
    const parsed = emailOnlySchema.safeParse(body);

    if (!parsed.success) {
      throw new AuthError("Valid email is required", 400, "validation_error");
    }

    const email = parsed.data.email.toLowerCase().trim();
    await requestPasswordReset(email);

    await logAudit({
      action: "password.reset.request",
      request,
      success: true,
      email,
    });

    return jsonOk({
      success: true,
      message:
        "If an account exists for this email, a password reset link was sent.",
    });
  },
  { rateLimit: "email" }
);
