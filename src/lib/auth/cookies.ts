import { cookies } from "next/headers";
import { REFRESH_COOKIE, TENANT_REFRESH_COOKIE } from "./tokens";
import type { TokenSubjectType } from "./tokens";

const isProd = process.env.NODE_ENV === "production";

function cookieName(sessionType: TokenSubjectType): string {
  return sessionType === "end_user" ? TENANT_REFRESH_COOKIE : REFRESH_COOKIE;
}

export async function setRefreshCookie(
  token: string,
  expiresAt: Date,
  sessionType: TokenSubjectType = "platform"
): Promise<void> {
  const jar = await cookies();
  jar.set(cookieName(sessionType), token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    // Host-only: no Domain attribute (tenant isolation)
  });
}

export async function getRefreshCookie(
  sessionType: TokenSubjectType = "platform"
): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(cookieName(sessionType))?.value;
}

export async function clearRefreshCookie(
  sessionType: TokenSubjectType = "platform"
): Promise<void> {
  const jar = await cookies();
  jar.delete(cookieName(sessionType));
}
