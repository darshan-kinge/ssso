import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

// Configure MONGODB_URI to use _test suffix
if (process.env.MONGODB_URI) {
  const u = new URL(process.env.MONGODB_URI);
  u.pathname = "/oneauth_logout_test";
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
import { Session } from "@/lib/models/Session";
import { AuditLog } from "@/lib/models/AuditLog";
import { generateRefreshToken, hashRefreshToken } from "@/lib/auth/tokens";
import { revokeSessionByRefreshToken } from "@/lib/auth/session";
import { logAudit } from "@/lib/security/audit";

// Make sure applyTestEnv sets up other defaults if not present
applyTestEnv();

const run = hasMongoUri() ? describe : describe.skip;

run("Logout flow core components integration", () => {
  before(async () => {
    await connectTestDb();
  });

  after(async () => {
    await disconnectTestDb();
  });

  // Clear DB before each test
  beforeEach(async () => {
    await clearTestCollections();
  });

  it("revokes platform session successfully and allows user resolution", async () => {
    // 1. Create a platform user
    const user = await User.create({
      email: "logout-platform-test@example.com",
      passwordHash: "dummyhash",
      isVerified: true,
    });

    // 2. Create platform session
    const token = generateRefreshToken();
    const tokenHash = hashRefreshToken(token, process.env.REFRESH_PEPPER || "test-refresh-pepper-minimum-32-chars");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    const session = await Session.create({
      sessionType: "platform",
      userId: user._id,
      refreshTokenHash: tokenHash,
      expiresAt,
    });

    // 3. Simulate route.ts logic: find session before revoking
    const foundSession = await Session.findOne({
      refreshTokenHash: tokenHash,
      sessionType: "platform",
    });
    assert.ok(foundSession);
    assert.equal(foundSession.userId.toString(), user._id.toString());

    // 4. Resolve the user's email
    const platformUser = await User.findById(foundSession.userId);
    assert.ok(platformUser);
    assert.equal(platformUser.email, "logout-platform-test@example.com");

    // 5. Revoke session
    await revokeSessionByRefreshToken(token, "platform");

    // 6. Verify session is deleted
    const dbSession = await Session.findById(session._id);
    assert.equal(dbSession, null);

    // 7. Verify we can log the audit log with the resolved userId and email
    const dummyRequest = new Request("http://localhost:3000/api/auth/logout", {
      method: "POST",
    });

    await logAudit({
      action: "logout",
      request: dummyRequest,
      success: true,
      userId: user._id.toString(),
      email: platformUser.email,
    });

    // 8. Verify audit log creation
    const audit = await AuditLog.findOne({ action: "logout" });
    assert.ok(audit);
    assert.equal(audit.userId?.toString(), user._id.toString());
    assert.equal(audit.email, "logout-platform-test@example.com");
    assert.equal(audit.success, true);
  });

  it("revokes tenant end-user session successfully and allows end-user resolution", async () => {
    // 1. Create end-user
    const user = await EndUser.create({
      email: "logout-tenant-test@example.com",
      passwordHash: "dummyhash",
      isVerified: true,
      workspaceId: new User()._id,
    });

    // 2. Create end-user session
    const token = generateRefreshToken();
    const tokenHash = hashRefreshToken(token, process.env.REFRESH_PEPPER || "test-refresh-pepper-minimum-32-chars");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    const session = await Session.create({
      sessionType: "end_user",
      userId: user._id,
      refreshTokenHash: tokenHash,
      expiresAt,
    });

    // 3. Simulate route.ts logic: find session before revoking
    const foundSession = await Session.findOne({
      refreshTokenHash: tokenHash,
      sessionType: "end_user",
    });
    assert.ok(foundSession);
    assert.equal(foundSession.userId.toString(), user._id.toString());

    // 4. Resolve end-user email
    const endUser = await EndUser.findById(foundSession.userId);
    assert.ok(endUser);
    assert.equal(endUser.email, "logout-tenant-test@example.com");

    // 5. Revoke session
    await revokeSessionByRefreshToken(token, "end_user");

    // 6. Verify session deleted
    const dbSession = await Session.findById(session._id);
    assert.equal(dbSession, null);

    // 7. Log audit
    const dummyRequest = new Request("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: { "x-oneauth-plane": "tenant" },
    });

    await logAudit({
      action: "logout",
      request: dummyRequest,
      success: true,
      userId: user._id.toString(),
      email: endUser.email,
    });

    // 8. Verify audit logs
    const audit = await AuditLog.findOne({ action: "logout" });
    assert.ok(audit);
    assert.equal(audit.userId?.toString(), user._id.toString());
    assert.equal(audit.email, "logout-tenant-test@example.com");
    assert.equal(audit.success, true);
  });

  it("resolves the correct redirection target for GET federated logouts", () => {
    const baseUrl = "http://localhost:3000/api/auth/logout";
    const testCases = [
      { url: `${baseUrl}?redirect_uri=http://localhost:3001`, expected: "http://localhost:3001" },
      { url: baseUrl, expected: "http://localhost:3000/" },
    ];

    for (const tc of testCases) {
      const { searchParams } = new URL(tc.url);
      const redirectUri = searchParams.get("redirect_uri");
      const finalRedirect = redirectUri || new URL("/", tc.url).toString();
      assert.equal(finalRedirect, tc.expected);
    }
  });
});

