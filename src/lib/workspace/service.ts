import { connectDb } from "@/lib/db/mongoose";
import { App } from "@/lib/models/App";
import { Membership, type MembershipRole } from "@/lib/models/Membership";
import { Workspace, type WorkspaceDocument } from "@/lib/models/Workspace";
import { AuthError } from "@/lib/auth/errors";
import type { Types } from "mongoose";
import {
  slugifyWorkspaceName,
  validateWorkspaceSlug,
} from "./slug";

export async function findWorkspaceBySlug(
  slug: string
): Promise<WorkspaceDocument | null> {
  await connectDb();
  return Workspace.findOne({ slug: slug.toLowerCase(), status: "active" });
}

export async function findWorkspaceById(
  id: string
): Promise<WorkspaceDocument | null> {
  await connectDb();
  return Workspace.findById(id);
}

export async function createWorkspaceForOwner(
  platformUserId: string,
  name: string,
  preferredSlug?: string
): Promise<{ workspace: WorkspaceDocument; role: MembershipRole }> {
  await connectDb();

  const base = slugifyWorkspaceName(preferredSlug ?? name) || "workspace";
  if (preferredSlug) {
    const check = validateWorkspaceSlug(base);
    if (!check.valid) {
      throw new AuthError(check.message, 400, "validation_error");
    }
  }

  let slug = base;
  let n = 0;
  while (await Workspace.findOne({ slug })) {
    n += 1;
    slug = `${base}-${n}`;
  }

  const workspace = await Workspace.create({
    slug,
    name: name.trim() || "My workspace",
    plan: "free",
    status: "active",
  });

  await Membership.create({
    workspaceId: workspace._id,
    platformUserId,
    role: "owner",
  });

  return { workspace, role: "owner" };
}

export async function ensureDefaultWorkspace(
  platformUserId: string,
  email: string
): Promise<WorkspaceDocument> {
  await connectDb();
  const existing = await Membership.findOne({ platformUserId }).sort({
    createdAt: 1,
  });

  if (existing) {
    const ws = await Workspace.findById(existing.workspaceId);
    if (ws) {
      await backfillAppsToWorkspace(platformUserId, ws._id);
      return ws;
    }
  }

  const local = email.split("@")[0] ?? "user";
  const { workspace } = await createWorkspaceForOwner(
    platformUserId,
    `${local}'s workspace`,
    local
  );
  await backfillAppsToWorkspace(platformUserId, workspace._id);
  return workspace;
}

async function backfillAppsToWorkspace(
  platformUserId: string,
  workspaceId: Types.ObjectId
): Promise<void> {
  await App.updateMany(
    { ownerId: platformUserId, workspaceId: { $exists: false } },
    { $set: { workspaceId } }
  );
  await App.updateMany(
    { ownerId: platformUserId, workspaceId: null },
    { $set: { workspaceId } }
  );
}

export async function listWorkspacesForUser(platformUserId: string) {
  await connectDb();
  const memberships = await Membership.find({ platformUserId }).sort({
    createdAt: 1,
  });

  const result = [];
  for (const m of memberships) {
    const workspace = await Workspace.findById(m.workspaceId);
    if (!workspace) continue;
    result.push({
      id: workspace._id.toString(),
      slug: workspace.slug,
      name: workspace.name,
      plan: workspace.plan,
      role: m.role,
      settings: workspace.settings,
    });
  }
  return result;
}

export async function getMembership(
  platformUserId: string,
  workspaceId: string
) {
  await connectDb();
  return Membership.findOne({ platformUserId, workspaceId });
}

const ROLE_RANK: Record<MembershipRole, number> = {
  owner: 4,
  admin: 3,
  developer: 2,
  viewer: 1,
};

export function hasMinimumRole(
  role: MembershipRole,
  minimum: MembershipRole
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export async function requireMembership(
  platformUserId: string,
  workspaceId: string,
  minimumRole: MembershipRole = "viewer"
) {
  const membership = await getMembership(platformUserId, workspaceId);
  if (!membership) {
    throw new AuthError("Not a member of this workspace", 403, "forbidden");
  }
  if (!hasMinimumRole(membership.role, minimumRole)) {
    throw new AuthError("Insufficient permissions", 403, "forbidden");
  }
  return membership;
}

export function toPublicWorkspace(workspace: WorkspaceDocument) {
  return {
    id: workspace._id.toString(),
    slug: workspace.slug,
    name: workspace.name,
    plan: workspace.plan,
    status: workspace.status,
    settings: workspace.settings,
  };
}
