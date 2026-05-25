import type { UserDocument } from "@/lib/models/User";
import { signAccessToken } from "@/lib/auth/tokens";
import { getConfig } from "@/lib/config";
import { createAuthorizationCode } from "./codes";
import { buildRedirectWithCode } from "./redirect";
import { validateOAuthClient } from "./apps";
import { assertAuthorizePkceForApp } from "./pkce-policy";

export type { AuthorizeParams } from "./params";
export { parseAuthorizeParams } from "./params";

import type { AuthorizeParams } from "./params";

export async function completeAuthorization(
  user: UserDocument,
  params: AuthorizeParams
): Promise<string> {
  const app = await validateOAuthClient(params.client_id, params.redirect_uri);
  assertAuthorizePkceForApp(app, params);
  const code = await createAuthorizationCode(
    user,
    params.client_id,
    params.redirect_uri,
    params.code_challenge
  );
  return buildRedirectWithCode(params.redirect_uri, code, params.state);
}

export function issueClientAccessToken(
  userId: string,
  email: string,
  clientId: string
) {
  const accessToken = signAccessToken(userId, email, clientId);
  const { accessTokenTtlSeconds } = getConfig().tokens;

  return {
    access_token: accessToken,
    token_type: "Bearer" as const,
    expires_in: accessTokenTtlSeconds,
  };
}
