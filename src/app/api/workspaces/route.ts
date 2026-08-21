import { getAuthenticatedPlatformUser } from "@/lib/auth/request";
import {
  listWorkspacesForUser,
  createWorkspaceForOwner,
} from "@/lib/workspace/service";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError } from "@/lib/auth/errors";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/)
    .optional(),
});

export const GET = withAuthRoute(async (request) => {
  const { user } = await getAuthenticatedPlatformUser(
    request.headers.get("authorization")
  );
  const workspaces = await listWorkspacesForUser(user._id.toString());
  return jsonOk({ workspaces });
});

export const POST = withAuthRoute(async (request) => {
  const { user } = await getAuthenticatedPlatformUser(
    request.headers.get("authorization")
  );
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    throw new AuthError(
      parsed.error.errors[0]?.message ?? "Invalid input",
      400,
      "validation_error"
    );
  }

  const { workspace, role } = await createWorkspaceForOwner(
    user._id.toString(),
    parsed.data.name,
    parsed.data.slug
  );

  return jsonOk(
    {
      workspace: {
        id: workspace._id.toString(),
        slug: workspace.slug,
        name: workspace.name,
        plan: workspace.plan,
        role,
      },
    },
    201
  );
});
