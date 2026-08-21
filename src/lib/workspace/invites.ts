import { getConfig } from "@/lib/config";
import { connectDb } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { Membership, type MembershipRole } from "@/lib/models/Membership";
import { WorkspaceInvite } from "@/lib/models/WorkspaceInvite";
import { Workspace } from "@/lib/models/Workspace";
import { AuthError } from "@/lib/auth/errors";
import {
  generateOpaqueToken,
  hashOpaqueToken,
} from "@/lib/auth/opaque-token";
import { sendEmail } from "@/lib/email/send";
import { inviteEmailContent } from "@/lib/email/templates";
import { getMembership, requireMembership } from "./service";
import { getPlatformBaseUrl } from "@/lib/config/deployment";

const INVITE_ROLES: MembershipRole[] = ["admin", "developer", "viewer"];

function inviteExpiresAt(): Date {
  const hours = getConfig().email.inviteTokenTtlHours;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export async function listPendingInvites(workspaceId: string) {
  await connectDb();
  const invites = await WorkspaceInvite.find({
    workspaceId,
    acceptedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  return invites.map((inv) => ({
    id: inv._id.toString(),
    email: inv.email,
    role: inv.role,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: (inv as { createdAt?: Date }).createdAt?.toISOString(),
  }));
}

export async function createWorkspaceInvite(
  workspaceId: string,
  invitedByUserId: string,
  email: string,
  role: MembershipRole
) {
  await connectDb();
  await requireMembership(invitedByUserId, workspaceId, "admin");

  if (!INVITE_ROLES.includes(role)) {
    throw new AuthError(
      "Cannot invite as owner; use transfer ownership instead",
      400,
      "validation_error"
    );
  }

  const normalized = email.toLowerCase().trim();
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AuthError("Workspace not found", 404, "not_found");
  }

  const existingUser = await User.findOne({ email: normalized });
  if (existingUser) {
    const member = await getMembership(existingUser._id.toString(), workspaceId);
    if (member) {
      throw new AuthError("User is already a member", 409, "already_member");
    }
  }

  await WorkspaceInvite.deleteMany({
    workspaceId,
    email: normalized,
    acceptedAt: null,
  });

  const token = generateOpaqueToken();
  const tokenHash = hashOpaqueToken(token);

  const invite = await WorkspaceInvite.create({
    workspaceId,
    email: normalized,
    role,
    tokenHash,
    invitedByPlatformUserId: invitedByUserId,
    expiresAt: inviteExpiresAt(),
  });

  const inviter = await User.findById(invitedByUserId);
  const mail = inviteEmailContent({
    token,
    workspaceName: workspace.name,
    role,
    inviterEmail: inviter?.email,
  });
  await sendEmail({ to: normalized, ...mail });

  return {
    id: invite._id.toString(),
    email: normalized,
    role,
    expiresAt: invite.expiresAt.toISOString(),
  };
}

export async function revokeWorkspaceInvite(
  workspaceId: string,
  actorUserId: string,
  inviteId: string
) {
  await connectDb();
  await requireMembership(actorUserId, workspaceId, "admin");

  const result = await WorkspaceInvite.deleteOne({
    _id: inviteId,
    workspaceId,
    acceptedAt: null,
  });

  if (result.deletedCount === 0) {
    throw new AuthError("Invite not found", 404, "not_found");
  }
}

export async function previewInvite(token: string) {
  await connectDb();
  const tokenHash = hashOpaqueToken(token);
  const invite = await WorkspaceInvite.findOne({ tokenHash });

  if (!invite || invite.acceptedAt) {
    throw new AuthError("Invalid or expired invite", 400, "invalid_token");
  }

  if (invite.expiresAt < new Date()) {
    await WorkspaceInvite.deleteOne({ _id: invite._id });
    throw new AuthError("Invite expired", 400, "token_expired");
  }

  const workspace = await Workspace.findById(invite.workspaceId);
  if (!workspace) {
    throw new AuthError("Workspace not found", 404, "not_found");
  }

  return {
    email: invite.email,
    role: invite.role,
    workspace: {
      id: workspace._id.toString(),
      name: workspace.name,
      slug: workspace.slug,
    },
  };
}

export async function acceptWorkspaceInvite(
  token: string,
  platformUserId: string
) {
  await connectDb();
  const tokenHash = hashOpaqueToken(token);
  const invite = await WorkspaceInvite.findOne({ tokenHash });

  if (!invite || invite.acceptedAt) {
    throw new AuthError("Invalid or expired invite", 400, "invalid_token");
  }

  if (invite.expiresAt < new Date()) {
    await WorkspaceInvite.deleteOne({ _id: invite._id });
    throw new AuthError("Invite expired", 400, "token_expired");
  }

  const user = await User.findById(platformUserId);
  if (!user) {
    throw new AuthError("User not found", 404, "user_not_found");
  }

  if (user.email.toLowerCase() !== invite.email) {
    throw new AuthError(
      "Sign in with the email address that received the invite",
      403,
      "email_mismatch"
    );
  }

  const existing = await getMembership(
    platformUserId,
    invite.workspaceId.toString()
  );
  if (existing) {
    invite.acceptedAt = new Date();
    await invite.save();
    return {
      workspaceId: invite.workspaceId.toString(),
      role: existing.role,
      alreadyMember: true,
    };
  }

  await Membership.create({
    workspaceId: invite.workspaceId,
    platformUserId: user._id,
    role: invite.role,
  });

  invite.acceptedAt = new Date();
  await invite.save();

  const workspace = await Workspace.findById(invite.workspaceId);

  return {
    workspaceId: invite.workspaceId.toString(),
    role: invite.role,
    workspaceName: workspace?.name,
    alreadyMember: false,
  };
}

export function buildInviteAcceptUrl(token: string): string {
  const base = getPlatformBaseUrl().replace(/\/$/, "");
  return `${base}/invite/accept?token=${encodeURIComponent(token)}`;
}
