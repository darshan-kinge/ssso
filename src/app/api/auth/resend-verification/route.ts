import { emailOnlySchema } from "@/lib/validators/email";
import { resendVerificationEmail } from "@/lib/auth/verification";
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
    await resendVerificationEmail(email);

    await logAudit({
      action: "email.resend",
      request,
      success: true,
      email,
    });

    return jsonOk({
      success: true,
      message:
        "If an unverified account exists for this email, a verification link was sent.",
    });
  },
  { rateLimit: "email" }
);
