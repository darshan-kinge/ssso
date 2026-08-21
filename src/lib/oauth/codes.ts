import { createHash, randomBytes } from "crypto";
import { getConfig } from "@/lib/config";
import { connectDb } from "@/lib/db/mongoose";
import { AuthorizationCode } from "@/lib/models/AuthorizationCode";
import type { EndUserDocument } from "@/lib/models/EndUser";
import type { UserDocument } from "@/lib/models/User";
import { AuthError } from "@/lib/auth/errors";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import {
  assertValidCodeVerifier,
  verifyCodeVerifier,
} from "./pkce";
import { normalizeRedirectUri } from "./redirect";
import type { OAuthSubject } from "./subject";
import type { Types } from "mongoose";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function codeExpiresAt(): Date {
  const { authorizationCodeTtlSeconds } = getConfig().oauth;
  return new Date(Date.now() + authorizationCodeTtlSeconds * 1000);
}

export async function createAuthorizationCode(
  subject: OAuthSubject,
  clientId: string,
  redirectUri: string,
  workspaceId: Types.ObjectId,
  codeChallenge?: string
): Promise<string> {
  await connectDb();

  const code = randomBytes(32).toString("base64url");
  const codeHash = hashCode(code);
  const normalizedRedirect = normalizeRedirectUri(redirectUri);

  const base = {
    codeHash,
    clientId,
    redirectUri: normalizedRedirect,
    codeChallenge: codeChallenge ?? null,
    expiresAt: codeExpiresAt(),
    workspaceId,
  };

  if (isMultiTenantEnabled() && subject.kind === "end_user") {
    await AuthorizationCode.create({
      ...base,
      endUserId: subject.user._id,
      userId: null,
    });
  } else if (subject.kind === "platform") {
    await AuthorizationCode.create({
      ...base,
      userId: subject.user._id,
      endUserId: null,
    });
  } else {
    await AuthorizationCode.create({
      ...base,
      endUserId: subject.user._id,
      userId: null,
    });
  }

  return code;
}

export async function consumeAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<{
  subjectId: string;
  email: string;
  workspaceId: string;
  isEndUser: boolean;
}> {
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

  const consumed = await AuthorizationCode.findOneAndUpdate(
    { _id: record._id, usedAt: null },
    { $set: { usedAt: new Date() } },
    { new: true }
  );
  if (!consumed) {
    throw new AuthError("Invalid authorization code", 400, "invalid_grant");
  }

  const isEndUser = Boolean(consumed.endUserId);
  const subjectId = (consumed.endUserId ?? consumed.userId)?.toString();
  if (!subjectId) {
    throw new AuthError("Invalid authorization code", 400, "invalid_grant");
  }

  let workspaceId = consumed.workspaceId?.toString();
  if (!workspaceId) {
    const app = await import("@/lib/oauth/apps").then((m) =>
      m.findAppByClientId(consumed.clientId)
    );
    workspaceId = app?.workspaceId?.toString();
  }
  if (!workspaceId) {
    throw new AuthError("Invalid authorization code", 400, "invalid_grant");
  }

  const { EndUser } = await import("@/lib/models/EndUser");
  const { User } = await import("@/lib/models/User");

  let email: string;
  if (isEndUser) {
    const u = await EndUser.findById(consumed.endUserId);
    if (!u) throw new AuthError("User not found", 400, "invalid_grant");
    email = u.email;
  } else {
    const u = await User.findById(consumed.userId);
    if (!u) throw new AuthError("User not found", 400, "invalid_grant");
    email = u.email;
  }

  return {
    subjectId,
    email,
    workspaceId,
    isEndUser,
  };
}

/** @deprecated Use OAuthSubject */
export type LegacyUser = UserDocument | EndUserDocument;
