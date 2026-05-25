import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyTestEnv } from "../helpers/env";
import {
  assertAuthorizePkceForApp,
  assertTokenExchangeForPublicApp,
  getAppClientType,
} from "@/lib/oauth/pkce-policy";
import { AuthError } from "@/lib/auth/errors";
import type { AppDocument } from "@/lib/models/App";

applyTestEnv();
process.env.REQUIRE_PKCE_FOR_PUBLIC_CLIENTS = "true";

function mockApp(clientType?: "public" | "confidential"): AppDocument {
  return { clientType } as AppDocument;
}

describe("PKCE policy", () => {
  it("defaults missing clientType to public", () => {
    assert.equal(getAppClientType(mockApp()), "public");
    assert.equal(getAppClientType(mockApp("confidential")), "confidential");
  });

  it("requires code_challenge for public clients on authorize", () => {
    assert.throws(
      () =>
        assertAuthorizePkceForApp(mockApp("public"), {
          client_id: "oa_x",
          redirect_uri: "http://localhost:3001/callback",
          response_type: "code",
        }),
      (err: unknown) =>
        err instanceof AuthError && err.code === "pkce_required"
    );
  });

  it("allows confidential clients without PKCE on authorize", () => {
    assert.doesNotThrow(() =>
      assertAuthorizePkceForApp(mockApp("confidential"), {
        client_id: "oa_x",
        redirect_uri: "http://localhost:3001/callback",
        response_type: "code",
      })
    );
  });

  it("blocks public clients from secret-only token exchange", () => {
    assert.throws(
      () =>
        assertTokenExchangeForPublicApp(mockApp("public"), {
          client_secret: "secret",
        }),
      (err: unknown) => err instanceof AuthError
    );
    assert.throws(
      () => assertTokenExchangeForPublicApp(mockApp("public"), {}),
      (err: unknown) => err instanceof AuthError
    );
    assert.doesNotThrow(() =>
      assertTokenExchangeForPublicApp(mockApp("public"), {
        code_verifier: "a".repeat(43),
      })
    );
  });
});
