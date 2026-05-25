import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  codeChallengeS256,
  generateCodeVerifier,
  verifyCodeVerifier,
  assertValidCodeChallenge,
} from "@/lib/oauth/pkce";
import { AuthError } from "@/lib/auth/errors";

describe("PKCE (RFC 7636 S256)", () => {
  it("generates verifier and matching challenge", async () => {
    const verifier = generateCodeVerifier();
    const challenge = codeChallengeS256(verifier);
    assert.equal(verifyCodeVerifier(verifier, challenge), true);
    assert.equal(verifyCodeVerifier(verifier, "wrong-challenge-value"), false);
  });

  it("rejects invalid challenge shape", () => {
    assert.throws(
      () => assertValidCodeChallenge("short"),
      (err) => err instanceof AuthError
    );
  });
});
