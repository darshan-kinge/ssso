import { connectDb } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import {
  Membership,
  type MembershipDocument,
  type MembershipRole,
} from "@/lib/models/Membership";
import { AuthError } from "@/lib/auth/errors";
import { getMembership, hasMinimumRole, requireMembership } from "./service";

export async function listWorkspaceMembers(workspaceId: string) {
  await connectDb();
  const memberships = await Membership.find({ workspaceId }).sort({
    createdAt: 1,
  });

  const members = [];
  for (const m of memberships) {
    const user = await User.findById(m.platformUserId);
    if (!user) continue;
    members.push({
      membershipId: m._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: m.role,
      joinedAt: (m as MembershipDocument & { createdAt?: Date }).createdAt?.toISOString(),
    });
  }
  return members;
}

export async function updateMemberRole(
  workspaceId: string,
  actorUserId: string,
  targetUserId: string,
  newRole: MembershipRole
) {
  await connectDb();
  await requireMembership(actorUserId, workspaceId, "admin");

  if (newRole === "owner") {
    throw new AuthError("Cannot assign owner via invite UI", 400, "validation_error");
  }

  const target = await getMembership(targetUserId, workspaceId);
  if (!target) {
    throw new AuthError("Member not found", 404, "not_found");
  }

  if (target.role === "owner") {
    throw new AuthError("Cannot change the workspace owner role", 403, "forbidden");
  }

  const actor = await getMembership(actorUserId, workspaceId);
  if (!actor) {
    throw new AuthError("Forbidden", 403, "forbidden");
  }

  if (target.role === "admin" && !hasMinimumRole(actor.role, "owner")) {
    throw new AuthError("Only the owner can change admins", 403, "forbidden");
  }

  if (!hasMinimumRole(actor.role, "admin")) {
    throw new AuthError("Insufficient permissions", 403, "forbidden");
  }

  target.role = newRole;
  await target.save();
  return target;
}

export async function removeWorkspaceMember(
  workspaceId: string,
  actorUserId: string,
  targetUserId: string
) {
  await connectDb();
  await requireMembership(actorUserId, workspaceId, "admin");

  const target = await getMembership(targetUserId, workspaceId);
  if (!target) {
    throw new AuthError("Member not found", 404, "not_found");
  }

  if (target.role === "owner") {
    throw new AuthError("Cannot remove the workspace owner", 403, "forbidden");
  }

  const actor = await getMembership(actorUserId, workspaceId);
  if (target.role === "admin" && actor && actor.role !== "owner") {
    throw new AuthError("Only the owner can remove admins", 403, "forbidden");
  }

  if (targetUserId === actorUserId) {
    throw new AuthError("Use leave workspace instead of removing yourself", 400, "validation_error");
  }

  await Membership.deleteOne({ _id: target._id });
}
