import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { applyTestEnv } from "../helpers/env";
import {
  connectTestDb,
  clearTestCollections,
  disconnectTestDb,
  hasMongoUri,
} from "../helpers/db";
import { User } from "@/lib/models/User";
import { Workspace } from "@/lib/models/Workspace";
import { Membership } from "@/lib/models/Membership";
import { hashPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/tokens";
import { GET as listMembers } from "@/app/api/workspaces/[id]/members/route";
import { GET as listInvites } from "@/app/api/workspaces/[id]/invites/route";

const run = hasMongoUri() ? describe : describe.skip;

applyTestEnv();
process.env.DEPLOYMENT_MODE = "saas";
process.env.MULTI_TENANT_ENABLED = "true";

run("Workspace route authorization", () => {
  let authorization = "";
  let foreignWorkspaceId = "";

  before(async () => {
    await connectTestDb();
    await clearTestCollections();

    const user = await User.create({
      email: "workspace-viewer@example.com",
      passwordHash: await hashPassword("test-password-12"),
      isVerified: true,
    });
    const activeWorkspace = await Workspace.create({
      slug: "active-workspace",
      name: "Active Workspace",
    });
    const foreignWorkspace = await Workspace.create({
      slug: "foreign-workspace",
      name: "Foreign Workspace",
    });
    await Membership.create({
      workspaceId: activeWorkspace._id,
      platformUserId: user._id,
      role: "viewer",
    });

    authorization = `Bearer ${signAccessToken(user._id.toString(), user.email, {
      type: "platform",
      workspaceId: activeWorkspace._id.toString(),
      role: "viewer",
    })}`;
    foreignWorkspaceId = foreignWorkspace._id.toString();
  });

  after(disconnectTestDb);

  it("rejects member and invite reads for another workspace", async () => {
    const request = new Request("http://localhost/api/workspaces/foreign", {
      headers: { authorization },
    });
    const context = {
      params: Promise.resolve({ id: foreignWorkspaceId }),
    };

    const [membersResponse, invitesResponse] = await Promise.all([
      listMembers(request, context),
      listInvites(request, context),
    ]);

    assert.equal(membersResponse.status, 403);
    assert.equal(invitesResponse.status, 403);
  });
});
