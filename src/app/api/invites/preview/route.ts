import { previewInvite } from "@/lib/workspace/invites";
import { assertWorkspaceCollaborationEnabled } from "@/lib/workspace/guard";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";

export async function GET(request: Request) {
  try {
    assertWorkspaceCollaborationEnabled();
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      throw new AuthError("token query parameter required", 400, "validation_error");
    }

    const preview = await previewInvite(token);
    return jsonOk(preview);
  } catch (err) {
    return handleApiError(err);
  }
}
