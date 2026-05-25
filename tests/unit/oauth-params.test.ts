import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseAuthorizeParams,
  buildAuthorizeQuery,
} from "@/lib/oauth/params";
import { codeChallengeS256, generateCodeVerifier } from "@/lib/oauth/pkce";

describe("OAuth authorize params", () => {
  it("parses and round-trips PKCE query", async () => {
    const verifier = generateCodeVerifier();
    const challenge = codeChallengeS256(verifier);
    const search = new URLSearchParams({
      client_id: "oa_test",
      redirect_uri: "http://localhost:3001/callback",
      response_type: "code",
      state: "s1",
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    const params = parseAuthorizeParams(search);
    assert.equal(params.code_challenge, challenge);
    assert.equal(params.code_challenge_method, "S256");

    const q = buildAuthorizeQuery(params);
    assert.ok(q.includes("code_challenge="));
    assert.ok(q.includes("code_challenge_method=S256"));
  });

  it("rejects unsupported challenge method", () => {
    const search = new URLSearchParams({
      client_id: "oa_test",
      redirect_uri: "http://localhost:3001/callback",
      response_type: "code",
      code_challenge: "a".repeat(43),
      code_challenge_method: "plain",
    });
    assert.throws(
      () => parseAuthorizeParams(search),
      (err) => err instanceof Error && err.message === "unsupported_code_challenge_method"
    );
  });
});
