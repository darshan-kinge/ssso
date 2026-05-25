import { createHash, randomBytes } from "crypto";
import { getConfig } from "@/lib/config";
import { connectDb } from "@/lib/db/mongoose";
import { AuthorizationCode } from "@/lib/models/AuthorizationCode";
import type { UserDocument } from "@/lib/models/User";
import { AuthError } from "@/lib/auth/errors";
import {
  assertValidCodeVerifier,
  verifyCodeVerifier,
} from "./pkce";
import { normalizeRedirectUri } from "./redirect";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function codeExpiresAt(): Date {
  const { authorizationCodeTtlSeconds } = getConfig().oauth;
  return new Date(Date.now() + authorizationCodeTtlSeconds * 1000);
}

export async function createAuthorizationCode(
  user: UserDocument,
  clientId: string,
  redirectUri: string,
  codeChallenge?: string
): Promise<string> {
  await connectDb();

  const code = randomBytes(32).toString("base64url");
  const codeHash = hashCode(code);
  const normalizedRedirect = normalizeRedirectUri(redirectUri);

  await AuthorizationCode.create({
    codeHash,
    userId: user._id,
    clientId,
    redirectUri: normalizedRedirect,
    codeChallenge: codeChallenge ?? null,
    expiresAt: codeExpiresAt(),
  });

  return code;
}

export async function consumeAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<{ userId: string }> {
  await connectDb();

  const codeHash = hashCode(code);
  const normalizedRedirect = normalizeRedirectUri(redirectUri);

  const record = await AuthorizationCode.findOne({ codeHash });

  if (!record || record.usedAt) {
    throw new AuthError("Invalid authorization code", 400, "invalid_grant");
  }

  if (record.clientId !== clientId) {
    throw new AuthError("Invalid authorization code", 400, "invalid_grant");
  }

  if (record.redirectUri !== normalizedRedirect) {
    throw new AuthError("redirect_uri mismatch", 400, "invalid_grant");
  }

  if (record.expiresAt < new Date()) {
    await AuthorizationCode.deleteOne({ _id: record._id });
    throw new AuthError("Authorization code expired", 400, "invalid_grant");
  }

  if (record.codeChallenge) {
    if (!codeVerifier) {
      throw new AuthError("code_verifier required", 400, "invalid_grant");
    }
    assertValidCodeVerifier(codeVerifier);
    if (!verifyCodeVerifier(codeVerifier, record.codeChallenge)) {
      throw new AuthError("Invalid code_verifier", 400, "invalid_grant");
    }
  }

  record.usedAt = new Date();
  await record.save();

  return { userId: record.userId.toString() };
}
