import { getConfig } from "@/lib/config";
import { AuthError } from "@/lib/auth/errors";
import type { AppDocument } from "@/lib/models/App";
import type { AuthorizeParams } from "./params";

export type OAuthClientType = "public" | "confidential";

export function getAppClientType(app: AppDocument): OAuthClientType {
  const t = app.clientType as OAuthClientType | undefined;
  return t === "confidential" ? "confidential" : "public";
}

export function assertAuthorizePkceForApp(
  app: AppDocument,
  params: AuthorizeParams
): void {
  if (!getConfig().oauth.requirePkceForPublicClients) return;
  if (getAppClientType(app) !== "public") return;
  if (!params.code_challenge) {
    throw new AuthError(
      "Public clients must send code_challenge and code_challenge_method=S256 (PKCE)",
      400,
      "pkce_required"
    );
  }
}

export function assertTokenExchangeForPublicApp(
  app: AppDocument,
  input: { code_verifier?: string; client_secret?: string }
): void {
  if (getAppClientType(app) !== "public") return;

  if (input.client_secret) {
    throw new AuthError(
      "Public clients must not send client_secret; use code_verifier",
      400,
      "invalid_request"
    );
  }

  if (!input.code_verifier) {
    throw new AuthError(
      "Public clients must exchange the code with code_verifier (PKCE)",
      400,
      "invalid_grant"
    );
  }
}
