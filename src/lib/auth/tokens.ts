import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { getConfig } from "@/lib/config";
import { requireAuthSecrets } from "./secrets";

export const REFRESH_COOKIE = "oneauth_refresh";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  client_id?: string;
}

export function hashRefreshToken(token: string, pepper: string): string {
  return createHash("sha256").update(`${token}:${pepper}`).digest("hex");
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function signAccessToken(
  userId: string,
  email: string,
  clientId?: string
): string {
  const { jwtSecret } = requireAuthSecrets();
  const { accessTokenTtlSeconds } = getConfig().tokens;

  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    ...(clientId ? { client_id: clientId } : {}),
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: accessTokenTtlSeconds,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const { jwtSecret } = requireAuthSecrets();

  try {
    const decoded = jwt.verify(token, jwtSecret) as AccessTokenPayload;
    if (!decoded.sub || !decoded.email) {
      throw new Error("invalid payload");
    }
    return decoded;
  } catch {
    throw new Error("invalid_token");
  }
}

export function refreshTokenExpiresAt(): Date {
  const { refreshTokenTtlDays } = getConfig().tokens;
  const ms = refreshTokenTtlDays * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}
