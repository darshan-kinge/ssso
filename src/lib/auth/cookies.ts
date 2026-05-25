import { cookies } from "next/headers";
import { REFRESH_COOKIE } from "./tokens";

const isProd = process.env.NODE_ENV === "production";

export async function setRefreshCookie(token: string, expiresAt: Date): Promise<void> {
  const jar = await cookies();
  jar.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getRefreshCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
}

export async function clearRefreshCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(REFRESH_COOKIE);
}
