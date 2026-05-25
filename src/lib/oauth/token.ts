import { connectDb } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { AuthError } from "@/lib/auth/errors";
import { toPublicUser } from "@/lib/auth/session";
import { verifyClientSecret } from "./credentials";
import { findAppByClientId } from "./apps";
import { assertTokenExchangeForPublicApp } from "./pkce-policy";
import { consumeAuthorizationCode } from "./codes";
import { issueClientAccessToken } from "./authorize";
import type { TokenRequestInput } from "@/lib/validators/oauth";

export async function exchangeAuthorizationCode(input: TokenRequestInput) {
  await connectDb();

  const app = await findAppByClientId(input.client_id);
  if (!app) {
    throw new AuthError("Invalid client credentials", 401, "invalid_client");
  }

  assertTokenExchangeForPublicApp(app, input);

  const usesPkce = Boolean(input.code_verifier);

  if (usesPkce) {
    if (input.client_secret) {
      throw new AuthError(
        "Do not send client_secret when using PKCE",
        400,
        "invalid_request"
      );
    }
  } else {
    if (
      !input.client_secret ||
      !verifyClientSecret(input.client_secret, app.clientSecretHash)
    ) {
      throw new AuthError("Invalid client credentials", 401, "invalid_client");
    }
  }

  const { userId } = await consumeAuthorizationCode(
    input.code,
    input.client_id,
    input.redirect_uri,
    input.code_verifier
  );

  const user = await User.findById(userId);
  if (!user) {
    throw new AuthError("User not found", 400, "invalid_grant");
  }

  const tokens = issueClientAccessToken(
    user._id.toString(),
    user.email,
    input.client_id
  );

  return {
    ...tokens,
    user: toPublicUser(user),
  };
}
