import { getAuthenticatedUser } from "@/lib/auth/request";
import { revokeSessionForUser } from "@/lib/auth/sessions-mgmt";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { user } = await getAuthenticatedUser(
      request.headers.get("authorization")
    );

    const { id } = await context.params;
    const result = await revokeSessionForUser(user._id.toString(), id);

    await logAudit({
      action: "session.revoke",
      request,
      success: true,
      userId: user._id.toString(),
      email: user.email,
      meta: { sessionId: id, revokedCurrent: result.revokedCurrent },
    });

    return jsonOk({ success: true, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
