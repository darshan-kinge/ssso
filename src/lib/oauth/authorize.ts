import { signAccessToken } from "@/lib/auth/tokens";
import { getConfig } from "@/lib/config";
import { createAuthorizationCode } from "./codes";
import { buildRedirectWithCode } from "./redirect";
import { validateOAuthClient } from "./apps";
import { assertAuthorizePkceForApp } from "./pkce-policy";
import type { OAuthSubject } from "./subject";

export type { AuthorizeParams } from "./params";
export { parseAuthorizeParams } from "./params";

import type { AuthorizeParams } from "./params";

export async function completeAuthorization(
  subject: OAuthSubject,
  params: AuthorizeParams
): Promise<string> {
  const app = await validateOAuthClient(
    params.client_id,
    params.redirect_uri
  );
  assertAuthorizePkceForApp(app, params);

  const workspaceId = app.workspaceId;
  if (!workspaceId) {
    throw new Error("App missing workspaceId");
  }

  const code = await createAuthorizationCode(
    subject,
    params.client_id,
    params.redirect_uri,
    workspaceId,
    params.code_challenge
  );
  return buildRedirectWithCode(params.redirect_uri, code, params.state);
}

export function issueClientAccessToken(
  userId: string,
  email: string,
  clientId: string,
  workspaceId: string
) {
  const accessToken = signAccessToken(userId, email, {
    type: "end_user",
    clientId,
    workspaceId,
  });
  const { accessTokenTtlSeconds } = getConfig().tokens;

  return {
    access_token: accessToken,
    token_type: "Bearer" as const,
    expires_in: accessTokenTtlSeconds,
  };
}
