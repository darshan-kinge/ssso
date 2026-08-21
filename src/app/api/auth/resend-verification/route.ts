import { emailOnlySchema } from "@/lib/validators/email";
import { resendVerificationEmail } from "@/lib/auth/verification";
import { resendEndUserVerificationEmail } from "@/lib/end-user/verification";
import {
  getRequestPlane,
  getResolvedTenantWorkspace,
} from "@/lib/workspace/request-context";
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
    const oauthReturn = body.oauthReturn ?? null;
    const plane = await getRequestPlane();

    if (plane === "tenant") {
      const workspace = await getResolvedTenantWorkspace();
      if (!workspace) {
        throw new AuthError("Unknown tenant workspace", 404, "tenant_not_found");
      }
      await resendEndUserVerificationEmail(email, workspace, oauthReturn);
    } else {
      await resendVerificationEmail(email, oauthReturn);
    }

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
