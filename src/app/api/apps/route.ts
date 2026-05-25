import { getAuthenticatedUser } from "@/lib/auth/request";
import { createApp, listAppsForOwner, toPublicApp } from "@/lib/oauth/apps";
import { createAppSchema } from "@/lib/validators/app";
import { jsonOk } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import { AuthError } from "@/lib/auth/errors";

export const GET = withAuthRoute(async (request) => {
  const { user } = await getAuthenticatedUser(
    request.headers.get("authorization")
  );
  const apps = await listAppsForOwner(user._id.toString());
  return jsonOk({ apps });
});

export const POST = withAuthRoute(async (request) => {
  const { user } = await getAuthenticatedUser(
    request.headers.get("authorization")
  );

  const body = await request.json();
  const parsed = createAppSchema.safeParse(body);

  if (!parsed.success) {
    throw new AuthError(
      parsed.error.errors[0]?.message ?? "Invalid input",
      400,
      "validation_error"
    );
  }

  const { app, clientSecret } = await createApp(
    user._id.toString(),
    parsed.data.name,
    parsed.data.redirectUrls,
    parsed.data.clientType
  );

  return jsonOk(
    {
      app: toPublicApp(app),
      clientSecret,
    },
    201
  );
});
