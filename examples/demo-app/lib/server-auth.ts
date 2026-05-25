import { NextResponse } from "next/server";
import {
  extractBearerToken,
  verifyAccessToken,
  type OneAuthJwtPayload,
} from "@oneauth/node";

export function getJwtSecret(): string | null {
  const secret = process.env.ONEAUTH_JWT_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function requireUser(
  request: Request
): { user: OneAuthJwtPayload } | NextResponse {
  const secret = getJwtSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "ONEAUTH_JWT_SECRET not configured", code: "misconfigured" },
      { status: 503 }
    );
  }

  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json(
      { error: "Missing Bearer token", code: "unauthorized" },
      { status: 401 }
    );
  }

  try {
    const user = verifyAccessToken(token, {
      jwtSecret: secret,
      clientId: process.env.NEXT_PUBLIC_ONEAUTH_CLIENT_ID,
    });
    return { user };
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token", code: "invalid_token" },
      { status: 401 }
    );
  }
}
