const VERIFIER_KEY = "oneauth_code_verifier";

/** RFC 7636 PKCE helpers (browser or Node 18+). */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    throw new Error("crypto.getRandomValues is not available");
  }
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function codeChallengeS256(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function storeCodeVerifier(verifier: string, key = VERIFIER_KEY): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(key, verifier);
}

export function takeCodeVerifier(key = VERIFIER_KEY): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const v = sessionStorage.getItem(key);
  if (v) sessionStorage.removeItem(key);
  return v;
}

export const PKCE_VERIFIER_KEY = VERIFIER_KEY;
