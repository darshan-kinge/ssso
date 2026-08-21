import { NextResponse } from "next/server";
import {
  extractBearerToken,
  verifyAccessToken,
  type SssoJwtPayload,
} from "@ssso/node";

export function getJwtSecret(): string | null {
  const secret = process.env.SSSO_JWT_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function requireUser(
  request: Request
): { user: SssoJwtPayload } | NextResponse {
  const secret = getJwtSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "SSSO_JWT_SECRET not configured", code: "misconfigured" },
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
      clientId: process.env.NEXT_PUBLIC_SSSO_CLIENT_ID,
    });
    return { user };
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token", code: "invalid_token" },
      { status: 401 }
    );
  }
}
