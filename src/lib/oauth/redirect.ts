import { AuthError } from "@/lib/auth/errors";

/** Normalize URI for exact comparison (no open redirects). */
export function normalizeRedirectUri(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.protocol}//${url.host}${path}${url.search}`;
  } catch {
    throw new AuthError("Invalid redirect_uri", 400, "invalid_redirect_uri");
  }
}

export function isRedirectUriAllowed(
  redirectUri: string,
  allowedUrls: string[]
): boolean {
  const normalized = normalizeRedirectUri(redirectUri);
  return allowedUrls.some(
    (allowed) => normalizeRedirectUri(allowed) === normalized
  );
}

export function buildRedirectWithCode(
  redirectUri: string,
  code: string,
  state?: string
): string {
  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) {
    url.searchParams.set("state", state);
  }
  return url.toString();
}
