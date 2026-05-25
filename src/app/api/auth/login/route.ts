import { loginSchema } from "@/lib/validators/auth";
import { loginUser } from "@/lib/auth/service";
import { getDeviceLabel } from "@/lib/auth/request";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError, isAuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";

export const POST = withAuthRoute(
  async (request) => {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

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
      const result = await loginUser(parsed.data, device);
      await logAudit({
        action: "login.success",
        request,
        success: true,
        userId: result.user.id,
        email,
      });
      return jsonOk(result);
    } catch (err) {
      if (isAuthError(err) && err.code === "invalid_credentials") {
        await logAudit({
          action: "login.failed",
          request,
          success: false,
          email,
        });
      }
      throw err;
    }
  },
  { rateLimit: "login" }
);
