import {
  requireWorkspaceRole,
  getAuthenticatedUser,
} from "@/lib/auth/request";
import { rotateAppSecret, toPublicApp } from "@/lib/oauth/apps";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { ensureDefaultWorkspace } from "@/lib/workspace/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const auth = request.headers.get("authorization");
    let workspaceId: string;

    if (isMultiTenantEnabled()) {
      const ctx = await requireWorkspaceRole(auth, "admin");
      workspaceId = ctx.workspaceId!;
    } else {
      const { user } = await getAuthenticatedUser(auth);
      const ws = await ensureDefaultWorkspace(
        user._id.toString(),
        user.email
      );
      workspaceId = ws._id.toString();
    }

    const { id } = await context.params;
    const { app, clientSecret } = await rotateAppSecret(workspaceId, id);

    return jsonOk({
      app: toPublicApp(app),
      clientSecret,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
