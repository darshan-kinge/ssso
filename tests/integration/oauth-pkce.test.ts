import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Types } from "mongoose";
import { applyTestEnv } from "../helpers/env";
import {
  connectTestDb,
  clearTestCollections,
  disconnectTestDb,
  hasMongoUri,
} from "../helpers/db";
import { User } from "@/lib/models/User";
import { App } from "@/lib/models/App";
import { Workspace } from "@/lib/models/Workspace";
import { hashPassword } from "@/lib/auth/password";
import { createApp } from "@/lib/oauth/apps";
import {
  createAuthorizationCode,
  consumeAuthorizationCode,
} from "@/lib/oauth/codes";
import { exchangeAuthorizationCode } from "@/lib/oauth/token";
import {
  codeChallengeS256,
  generateCodeVerifier,
} from "@/lib/oauth/pkce";
import { AuthError } from "@/lib/auth/errors";

const run = hasMongoUri() ? describe : describe.skip;

applyTestEnv();

run("OAuth PKCE integration", () => {
  const redirectUri = "http://localhost:3001/callback";
  let clientId = "";
  let workspaceId: Types.ObjectId;

  before(async () => {
    applyTestEnv(process.env.MONGODB_URI);
    await connectTestDb();
    await clearTestCollections();

    const passwordHash = await hashPassword("test-password-12");
    const user = await User.create({
      email: "pkce-test@example.com",
      passwordHash,
      isVerified: true,
    });
    const workspace = await Workspace.create({
      slug: "pkce-test",
      name: "PKCE Test",
    });
    workspaceId = workspace._id;

    const { app } = await createApp(
      user._id.toString(),
      workspace._id.toString(),
      "PKCE Test App",
      [redirectUri],
      "public"
    );
    clientId = app.clientId;
  });

  after(async () => {
    await disconnectTestDb();
  });

  it("exchanges code with code_verifier", async () => {
    const user = await User.findOne({ email: "pkce-test@example.com" });
    assert.ok(user);

    const verifier = generateCodeVerifier();
    const challenge = codeChallengeS256(verifier);
    const code = await createAuthorizationCode(
      { kind: "platform", user },
      clientId,
      redirectUri,
      workspaceId,
      challenge
    );

    const tokens = await exchangeAuthorizationCode({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });

    assert.equal(tokens.token_type, "Bearer");
    assert.equal(tokens.user.email, "pkce-test@example.com");
  });

  it("rejects client_secret for public client", async () => {
    const user = await User.findOne({ email: "pkce-test@example.com" });
    assert.ok(user);

    const verifier = generateCodeVerifier();
    const code = await createAuthorizationCode(
      { kind: "platform", user },
      clientId,
      redirectUri,
      workspaceId,
      codeChallengeS256(verifier)
    );

    await assert.rejects(
      () =>
        exchangeAuthorizationCode({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          redirect_uri: redirectUri,
          client_secret: "any-secret",
        }),
      (err: unknown) => err instanceof AuthError
    );
  });

  it("requires code_verifier when challenge was stored", async () => {
    const user = await User.findOne({ email: "pkce-test@example.com" });
    assert.ok(user);

    const verifier = generateCodeVerifier();
    const code = await createAuthorizationCode(
      { kind: "platform", user },
      clientId,
      redirectUri,
      workspaceId,
      codeChallengeS256(verifier)
    );

    await assert.rejects(
      () =>
        consumeAuthorizationCode(code, clientId, redirectUri, undefined),
      (err: unknown) => err instanceof AuthError
    );
  });

  it("allows only one concurrent code redemption", async () => {
    const user = await User.findOne({ email: "pkce-test@example.com" });
    assert.ok(user);

    const verifier = generateCodeVerifier();
    const code = await createAuthorizationCode(
      { kind: "platform", user },
      clientId,
      redirectUri,
      workspaceId,
      codeChallengeS256(verifier)
    );
    const results = await Promise.allSettled([
      consumeAuthorizationCode(code, clientId, redirectUri, verifier),
      consumeAuthorizationCode(code, clientId, redirectUri, verifier),
    ]);

    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  });

  it("stores public clientType on app", async () => {
    const doc = await App.findOne({ clientId });
    assert.ok(doc);
    assert.equal(doc.clientType, "public");
  });
});
