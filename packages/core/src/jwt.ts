import type { AccessTokenClaims, OneAuthUser } from "./types.js";

/** Decode JWT payload without verification (client display only). */
export function decodeAccessToken(token: string): AccessTokenClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    if (typeof atob === "undefined") {
      return null;
    }
    const json = atob(payload);
    return JSON.parse(json) as AccessTokenClaims;
  } catch {
    return null;
  }
}

export function userFromClaims(
  claims: AccessTokenClaims,
  isVerified = true
): OneAuthUser {
  return {
    id: claims.sub,
    email: claims.email,
    isVerified,
    clientId: claims.client_id,
  };
}

export function isTokenExpired(claims: AccessTokenClaims): boolean {
  if (!claims.exp) return false;
  return claims.exp * 1000 < Date.now();
}
