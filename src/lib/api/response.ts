import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/errors";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(
  message: string,
  status: number,
  code?: string
) {
  return NextResponse.json({ error: message, code }, { status });
}

export function handleApiError(err: unknown) {
  if (isAuthError(err)) {
    return jsonError(err.message, err.status, err.code);
  }

  if (err instanceof Error && err.message === "invalid_token") {
    return jsonError("Invalid or expired access token", 401, "invalid_token");
  }

  console.error(err);
  return jsonError("Internal server error", 500);
}
