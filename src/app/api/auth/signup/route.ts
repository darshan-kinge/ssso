import { signupSchema } from "@/lib/validators/auth";
import { signupUser } from "@/lib/auth/service";
import { getDeviceLabel } from "@/lib/auth/request";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError, isAuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";

export const POST = withAuthRoute(
  async (request) => {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      throw new AuthError(
        parsed.error.errors[0]?.message ?? "Invalid input",
        400,
        "validation_error"
      );
    }

    const email = parsed.data.email.toLowerCase().trim();

    try {
      const device = await getDeviceLabel();
      const result = await signupUser(parsed.data, device);
      await logAudit({
        action: "signup.success",
        request,
        success: true,
        userId: result.user.id,
        email,
        meta: { verificationRequired: result.verificationRequired ?? false },
      });
      return jsonOk(result, 201);
    } catch (err) {
      if (isAuthError(err) && err.code === "email_exists") {
        await logAudit({
          action: "signup.failed",
          request,
          success: false,
          email,
          meta: { reason: "email_exists" },
        });
      }
      throw err;
    }
  },
  { rateLimit: "signup" }
);
