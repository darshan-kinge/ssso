import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

if (process.env.MONGODB_URI) {
  const u = new URL(process.env.MONGODB_URI);
  u.pathname = "/oneauth_verification_test";
  process.env.MONGODB_URI = u.toString();
}

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  connectTestDb,
  clearTestCollections,
  disconnectTestDb,
  hasMongoUri,
} from "../helpers/db";
import { applyTestEnv } from "../helpers/env";
import { User } from "@/lib/models/User";
import { EndUser } from "@/lib/models/EndUser";
import { Workspace } from "@/lib/models/Workspace";
import { VerificationToken } from "@/lib/models/VerificationToken";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/auth/opaque-token";
import {
  createAndSendVerificationEmail,
  verifyEmailWithToken,
  resendVerificationEmail,
} from "@/lib/auth/verification";
import {
  createAndSendEndUserVerificationEmail,
  verifyEndUserEmailWithToken,
  resendEndUserVerificationEmail,
} from "@/lib/end-user/verification";

applyTestEnv();

const run = hasMongoUri() ? describe : describe.skip;

run("Email Verification oauthReturn Integration", () => {
  before(async () => {
    await connectTestDb();
  });

  after(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestCollections();
  });

  it("preserves, returns and resends oauthReturn for platform users", async () => {
    // 1. Create a platform user
    const user = await User.create({
      email: "platform-verification-test@example.com",
      passwordHash: "dummyhash",
      isVerified: false,
    });

    const oauthReturn = "/authorize?client_id=test-client&redirect_uri=http://localhost:3001/callback";

    // 2. Create verification email token record
    await createAndSendVerificationEmail(user, oauthReturn);

    // 3. Verify it was created in the DB with the oauthReturn value
    const tokenRecord = await VerificationToken.findOne({ userId: user._id });
    assert.ok(tokenRecord);
    assert.equal(tokenRecord.oauthReturn, oauthReturn);

    // 4. Test resending verification email
    await resendVerificationEmail(user.email, oauthReturn + "&extra=1");
    const newTokenRecord = await VerificationToken.findOne({
      userId: user._id,
      usedAt: null,
    });
    assert.ok(newTokenRecord);
    assert.notEqual(newTokenRecord.tokenHash, tokenRecord.tokenHash);
    assert.equal(newTokenRecord.oauthReturn, oauthReturn + "&extra=1");

    // 5. Test verification of token returns the oauthReturn URL
    const mockToken = generateOpaqueToken();
    const mockTokenHash = hashOpaqueToken(mockToken);
    await VerificationToken.create({
      userId: user._id,
      tokenHash: mockTokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      oauthReturn,
    });

    const verifyResult = await verifyEmailWithToken(mockToken);
    assert.equal(verifyResult.oauthReturn, oauthReturn);
    assert.equal(verifyResult.user._id.toString(), user._id.toString());

    // User should now be verified
    const dbUser = await User.findById(user._id);
    assert.ok(dbUser);
    assert.equal(dbUser.isVerified, true);
  });

  it("preserves, returns and resends oauthReturn for tenant end-users", async () => {
    // 1. Create a workspace
    const workspace = await Workspace.create({
      name: "Test Workspace",
      slug: "test-workspace",
    });

    // 2. Create end user
    const user = await EndUser.create({
      workspaceId: workspace._id,
      email: "enduser-verification-test@example.com",
      passwordHash: "dummyhash",
      isVerified: false,
    });

    const oauthReturn = "/authorize?client_id=test-client-2&redirect_uri=http://localhost:3002/callback";

    // 3. Create verification email token record
    await createAndSendEndUserVerificationEmail(user, workspace, oauthReturn);

    // 4. Verify it was created in the DB with the oauthReturn value
    const tokenRecord = await VerificationToken.findOne({ endUserId: user._id });
    assert.ok(tokenRecord);
    assert.equal(tokenRecord.oauthReturn, oauthReturn);

    // 5. Test resending verification email
    await resendEndUserVerificationEmail(user.email, workspace, oauthReturn + "&extra=2");
    const newTokenRecord = await VerificationToken.findOne({
      endUserId: user._id,
      usedAt: null,
    });
    assert.ok(newTokenRecord);
    assert.notEqual(newTokenRecord.tokenHash, tokenRecord.tokenHash);
    assert.equal(newTokenRecord.oauthReturn, oauthReturn + "&extra=2");

    // 6. Test verification of end-user token returns the oauthReturn URL
    const mockToken = generateOpaqueToken();
    const mockTokenHash = hashOpaqueToken(mockToken);
    await VerificationToken.create({
      endUserId: user._id,
      workspaceId: workspace._id,
      tokenHash: mockTokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      oauthReturn,
    });

    const verifyResult = await verifyEndUserEmailWithToken(mockToken, workspace._id.toString());
    assert.equal(verifyResult.oauthReturn, oauthReturn);
    assert.equal(verifyResult.user._id.toString(), user._id.toString());

    // EndUser should now be verified
    const dbEndUser = await EndUser.findById(user._id);
    assert.ok(dbEndUser);
    assert.equal(dbEndUser.isVerified, true);
  });
});
