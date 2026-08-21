import { z } from "zod";
import { MEMBERSHIP_ROLES } from "@/lib/models/Membership";

const inviteRoles = MEMBERSHIP_ROLES.filter((r) => r !== "owner");

export const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(inviteRoles as [string, ...string[]]),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(inviteRoles as [string, ...string[]]),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
});
