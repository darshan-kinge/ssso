import { requireWorkspaceRole } from "@/lib/auth/request";
import { createApp, listAppsForWorkspace, toPublicApp } from "@/lib/oauth/apps";
import { createAppSchema } from "@/lib/validators/app";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError } from "@/lib/auth/errors";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { getAuthenticatedUser } from "@/lib/auth/request";
import { listAppsForOwner } from "@/lib/oauth/apps";

export const GET = withAuthRoute(async (request) => {
  const auth = request.headers.get("authorization");

  if (isMultiTenantEnabled()) {
    const ctx = await requireWorkspaceRole(auth, "viewer");
    const apps = await listAppsForWorkspace(ctx.workspaceId!);
    return jsonOk({ apps, workspaceId: ctx.workspaceId });
  }

  const { user } = await getAuthenticatedUser(auth);
  const apps = await listAppsForOwner(user._id.toString());
  return jsonOk({ apps });
});

export const POST = withAuthRoute(async (request) => {
  const auth = request.headers.get("authorization");
  const body = await request.json();
  const parsed = createAppSchema.safeParse(body);

  if (!parsed.success) {
    throw new AuthError(
      parsed.error.errors[0]?.message ?? "Invalid input",
      400,
      "validation_error"
    );
  }

  if (isMultiTenantEnabled()) {
    const ctx = await requireWorkspaceRole(auth, "developer");
    const { app, clientSecret } = await createApp(
      ctx.user._id.toString(),
      ctx.workspaceId!,
      parsed.data.name,
      parsed.data.redirectUrls,
      parsed.data.clientType
    );
    return jsonOk({ app: toPublicApp(app), clientSecret }, 201);
  }

  const { user } = await getAuthenticatedUser(auth);
  const { ensureDefaultWorkspace } = await import("@/lib/workspace/service");
  const ws = await ensureDefaultWorkspace(user._id.toString(), user.email);
  const { app, clientSecret } = await createApp(
    user._id.toString(),
    ws._id.toString(),
    parsed.data.name,
    parsed.data.redirectUrls,
    parsed.data.clientType
  );

  return jsonOk({ app: toPublicApp(app), clientSecret }, 201);
});
