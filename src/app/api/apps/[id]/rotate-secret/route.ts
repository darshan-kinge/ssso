import { getAuthenticatedUser } from "@/lib/auth/request";
import { rotateAppSecret, toPublicApp } from "@/lib/oauth/apps";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";

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

    const { user } = await getAuthenticatedUser(
      request.headers.get("authorization")
    );

    const { id } = await context.params;
    const { app, clientSecret } = await rotateAppSecret(
      user._id.toString(),
      id
    );

    return jsonOk({
      app: toPublicApp(app),
      clientSecret,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
