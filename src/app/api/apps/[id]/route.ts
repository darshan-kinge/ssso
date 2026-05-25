import { getAuthenticatedUser } from "@/lib/auth/request";
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

    const { user } = await getAuthenticatedUser(
      request.headers.get("authorization")
    );

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

    const app = await updateApp(user._id.toString(), id, parsed.data);

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

    const { user } = await getAuthenticatedUser(
      request.headers.get("authorization")
    );

    const { id } = await context.params;
    await deleteAppForOwner(user._id.toString(), id);

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
