import { createHash, randomBytes } from "crypto";
import { AuthError } from "@/lib/auth/errors";

const VERIFIER_MIN = 43;
const VERIFIER_MAX = 128;
const UNRESERVED = /^[A-Za-z0-9\-._~]+$/;

/** RFC 7636 code_verifier */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/** S256 code_challenge from verifier */
export function codeChallengeS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function verifyCodeVerifier(
  verifier: string,
  challenge: string
): boolean {
  return codeChallengeS256(verifier) === challenge;
}

export function assertValidCodeVerifier(verifier: string): void {
  if (
    verifier.length < VERIFIER_MIN ||
    verifier.length > VERIFIER_MAX ||
    !UNRESERVED.test(verifier)
  ) {
    throw new AuthError("Invalid code_verifier", 400, "invalid_request");
  }
}

export function assertValidCodeChallenge(challenge: string): void {
  if (!/^[A-Za-z0-9\-._~]+$/.test(challenge) || challenge.length < 43) {
    throw new AuthError("Invalid code_challenge", 400, "invalid_request");
  }
}
