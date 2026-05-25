import { connectDb } from "@/lib/db/mongoose";
import { App, type AppDocument } from "@/lib/models/App";
import { AuthError } from "@/lib/auth/errors";
import {
  generateClientId,
  generateClientSecret,
  hashClientSecret,
} from "./credentials";
import { isRedirectUriAllowed, normalizeRedirectUri } from "./redirect";
import type { OAuthClientType } from "./pkce-policy";
import { getAppClientType } from "./pkce-policy";

export function toPublicApp(app: AppDocument) {
  return {
    id: app._id.toString(),
    name: app.name,
    clientId: app.clientId,
    clientType: getAppClientType(app),
    redirectUrls: app.redirectUrls,
    createdAt: (app as AppDocument & { createdAt?: Date }).createdAt?.toISOString(),
  };
}

export async function findAppByClientId(clientId: string): Promise<AppDocument | null> {
  await connectDb();
  return App.findOne({ clientId });
}

export async function createApp(
  ownerId: string,
  name: string,
  redirectUrls: string[],
  clientType: OAuthClientType = "public"
): Promise<{ app: AppDocument; clientSecret: string }> {
  await connectDb();

  if (redirectUrls.length === 0) {
    throw new AuthError(
      "At least one redirect URL is required",
      400,
      "validation_error"
    );
  }

  const normalizedUrls = redirectUrls.map((u) => normalizeRedirectUri(u));
  const clientId = generateClientId();
  const clientSecret = generateClientSecret();
  const clientSecretHash = hashClientSecret(clientSecret);

  const app = await App.create({
    ownerId,
    name: name.trim(),
    clientId,
    clientSecretHash,
    redirectUrls: normalizedUrls,
    clientType,
  });

  return { app, clientSecret };
}

export async function listAppsForOwner(ownerId: string) {
  await connectDb();
  const apps = await App.find({ ownerId }).sort({ createdAt: -1 });
  return apps.map(toPublicApp);
}

export async function updateApp(
  ownerId: string,
  appId: string,
  input: { redirectUrls?: string[]; clientType?: OAuthClientType }
): Promise<AppDocument> {
  await connectDb();

  const app = await App.findOne({ _id: appId, ownerId });

  if (!app) {
    throw new AuthError("Application not found", 404, "not_found");
  }

  if (input.redirectUrls !== undefined) {
    if (input.redirectUrls.length === 0) {
      throw new AuthError(
        "At least one redirect URL is required",
        400,
        "validation_error"
      );
    }
    app.redirectUrls = input.redirectUrls.map((u) => normalizeRedirectUri(u));
  }

  if (input.clientType !== undefined) {
    app.clientType = input.clientType;
  }

  await app.save();
  return app;
}

/** @deprecated Use updateApp */
export async function updateAppRedirects(
  ownerId: string,
  appId: string,
  redirectUrls: string[]
): Promise<AppDocument> {
  return updateApp(ownerId, appId, { redirectUrls });
}

export async function findAppForOwner(
  ownerId: string,
  appId: string
): Promise<AppDocument | null> {
  await connectDb();
  return App.findOne({ _id: appId, ownerId });
}

export async function rotateAppSecret(
  ownerId: string,
  appId: string
): Promise<{ app: AppDocument; clientSecret: string }> {
  await connectDb();
  const app = await App.findOne({ _id: appId, ownerId });

  if (!app) {
    throw new AuthError("Application not found", 404, "not_found");
  }

  const clientSecret = generateClientSecret();
  app.clientSecretHash = hashClientSecret(clientSecret);
  await app.save();

  return { app, clientSecret };
}

export async function deleteAppForOwner(
  ownerId: string,
  appId: string
): Promise<void> {
  await connectDb();
  const result = await App.deleteOne({ _id: appId, ownerId });

  if (result.deletedCount === 0) {
    throw new AuthError("Application not found", 404, "not_found");
  }
}

export async function validateOAuthClient(
  clientId: string,
  redirectUri: string
): Promise<AppDocument> {
  const app = await findAppByClientId(clientId);
  if (!app) {
    throw new AuthError("Unknown client_id", 400, "invalid_client");
  }

  if (!isRedirectUriAllowed(redirectUri, app.redirectUrls)) {
    throw new AuthError(
      "redirect_uri is not registered for this application",
      400,
      "invalid_redirect_uri"
    );
  }

  return app;
}
