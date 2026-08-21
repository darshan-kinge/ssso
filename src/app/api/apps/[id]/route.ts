import { requireWorkspaceRole, getAuthenticatedUser } from "@/lib/auth/request";
import {
  toPublicApp,
  updateApp,
  deleteAppForOwner,
} from "@/lib/oauth/apps";
import { updateAppSchema } from "@/lib/validators/app";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { ensureDefaultWorkspace } from "@/lib/workspace/service";

async function resolveWorkspaceId(
  authorization: string | null
): Promise<string> {
  if (isMultiTenantEnabled()) {
    const ctx = await requireWorkspaceRole(authorization, "viewer");
    return ctx.workspaceId!;
  }
  const { user } = await getAuthenticatedUser(authorization);
  const ws = await ensureDefaultWorkspace(user._id.toString(), user.email);
  return ws._id.toString();
}

export async function PATCH(
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
    const workspaceId = await resolveWorkspaceId(auth);

    if (isMultiTenantEnabled()) {
      await requireWorkspaceRole(auth, "developer");
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateAppSchema.safeParse(body);

    if (!parsed.success) {
      throw new AuthError(
        parsed.error.errors[0]?.message ?? "Invalid input",
        400,
        "validation_error"
      );
    }

    const app = await updateApp(workspaceId, id, parsed.data);
    return jsonOk({ app: toPublicApp(app) });
  } catch (err) {
    return handleApiError(err);
  }
}

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

    const auth = request.headers.get("authorization");
    const workspaceId = await resolveWorkspaceId(auth);

    if (isMultiTenantEnabled()) {
      await requireWorkspaceRole(auth, "admin");
    }

    const { id } = await context.params;
    await deleteAppForOwner(workspaceId, id);

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
