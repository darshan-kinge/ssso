import jwt from "jsonwebtoken";
import type { AuthMiddlewareOptions, OneAuthJwtPayload } from "./types.js";

export function extractBearerToken(
  authorization: string | undefined | null
): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

export function verifyAccessToken(
  token: string,
  options: AuthMiddlewareOptions
): OneAuthJwtPayload {
  const decoded = jwt.verify(token, options.jwtSecret) as OneAuthJwtPayload;

  if (!decoded.sub || !decoded.email) {
    throw new Error("Invalid token payload");
  }

  if (options.clientId && decoded.client_id !== options.clientId) {
    throw new Error("Token client_id mismatch");
  }

  return decoded;
}
