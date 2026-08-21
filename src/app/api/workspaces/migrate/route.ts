import { getAuthenticatedPlatformUser } from "@/lib/auth/request";
import { ensureDefaultWorkspace } from "@/lib/workspace/service";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";

/** Backfill workspace + membership for existing platform users */
export const POST = withAuthRoute(async (request) => {
  const { user } = await getAuthenticatedPlatformUser(
    request.headers.get("authorization")
  );
  const workspace = await ensureDefaultWorkspace(
    user._id.toString(),
    user.email
  );
  return jsonOk({
    workspace: {
      id: workspace._id.toString(),
      slug: workspace.slug,
      name: workspace.name,
    },
  });
});
