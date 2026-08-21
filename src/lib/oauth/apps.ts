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
  workspaceId: string,
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
    workspaceId,
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

export async function listAppsForWorkspace(workspaceId: string) {
  await connectDb();
  const apps = await App.find({ workspaceId }).sort({ createdAt: -1 });
  return apps.map(toPublicApp);
}

export async function updateApp(
  workspaceId: string,
  appId: string,
  input: { redirectUrls?: string[]; clientType?: OAuthClientType }
): Promise<AppDocument> {
  await connectDb();

  const app = await App.findOne({ _id: appId, workspaceId });

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
  workspaceId: string,
  appId: string,
  redirectUrls: string[]
): Promise<AppDocument> {
  return updateApp(workspaceId, appId, { redirectUrls });
}

export async function findAppForOwner(
  workspaceId: string,
  appId: string
): Promise<AppDocument | null> {
  await connectDb();
  return App.findOne({ _id: appId, workspaceId });
}

export async function rotateAppSecret(
  workspaceId: string,
  appId: string
): Promise<{ app: AppDocument; clientSecret: string }> {
  await connectDb();
  const app = await App.findOne({ _id: appId, workspaceId });

  if (!app) {
    throw new AuthError("Application not found", 404, "not_found");
  }

  const clientSecret = generateClientSecret();
  app.clientSecretHash = hashClientSecret(clientSecret);
  await app.save();

  return { app, clientSecret };
}

export async function deleteAppForOwner(
  workspaceId: string,
  appId: string
): Promise<void> {
  await connectDb();
  const result = await App.deleteOne({ _id: appId, workspaceId });

  if (result.deletedCount === 0) {
    throw new AuthError("Application not found", 404, "not_found");
  }
}

export async function validateOAuthClient(
  clientId: string,
  redirectUri: string,
  expectedWorkspaceId?: string
): Promise<AppDocument> {
  const app = await findAppByClientId(clientId);
  if (!app) {
    throw new AuthError("Unknown client_id", 400, "invalid_client");
  }

  if (!app.workspaceId && app.ownerId) {
    const { User } = await import("@/lib/models/User");
    const owner = await User.findById(app.ownerId);
    if (owner) {
      const { ensureDefaultWorkspace } = await import("@/lib/workspace/service");
      const ws = await ensureDefaultWorkspace(
        owner._id.toString(),
        owner.email
      );
      await App.updateOne({ _id: app._id }, { workspaceId: ws._id });
      app.workspaceId = ws._id;
    }
  }

  if (expectedWorkspaceId && app.workspaceId?.toString() !== expectedWorkspaceId) {
    throw new AuthError(
      "Application does not belong to this workspace",
      400,
      "invalid_client"
    );
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
