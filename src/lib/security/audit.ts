import { getConfig } from "@/lib/config";
import { connectDb } from "@/lib/db/mongoose";
import { AuditLog, type AuditLogDocument } from "@/lib/models/AuditLog";
import type { RequestPlane } from "@/lib/config/deployment";
import { getClientIp } from "./client-ip";
import { resolveAuditContext } from "./audit-context";

export type AuditAction =
  | "login.success"
  | "login.failed"
  | "signup.success"
  | "signup.failed"
  | "logout"
  | "refresh.success"
  | "refresh.failed"
  | "session.revoke"
  | "session.revoke_all"
  | "oauth.token.success"
  | "oauth.token.failed"
  | "email.verify.success"
  | "email.verify.failed"
  | "email.resend"
  | "password.reset.request"
  | "password.reset.success"
  | "password.reset.failed"
  | "workspace.invite.create"
  | "workspace.invite.revoke"
  | "workspace.invite.accept"
  | "workspace.member.role_change"
  | "workspace.member.remove";

export interface AuditInput {
  action: AuditAction;
  request: Request;
  success: boolean;
  userId?: string;
  email?: string;
  plane?: RequestPlane;
  workspaceId?: string;
  meta?: Record<string, unknown>;
}

export async function logAudit(input: AuditInput): Promise<void> {
  if (!getConfig().features.auditLogEnabled) return;

  try {
    await connectDb();
    const resolved = await resolveAuditContext(input.request);
    const plane = input.plane ?? resolved.plane;
    const workspaceId =
      input.workspaceId ??
      (typeof input.meta?.workspaceId === "string"
        ? input.meta.workspaceId
        : undefined) ??
      resolved.workspaceId;

    const retentionDays = getConfig().features.auditRetentionDays;
    const expiresAt = new Date(
      Date.now() + retentionDays * 24 * 60 * 60 * 1000
    );

    await AuditLog.create({
      action: input.action,
      plane,
      workspaceId: workspaceId ?? null,
      userId: input.userId,
      email: input.email?.toLowerCase(),
      ip: getClientIp(input.request),
      success: input.success,
      meta: input.meta,
      expiresAt,
    });
  } catch (err) {
    console.error("[audit]", input.action, err);
  }
}

export async function listAuditForUser(userId: string, limit = 30) {
  await connectDb();
  const logs = await AuditLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);

  return mapAuditLogs(logs);
}

export async function listAuditForWorkspace(
  workspaceId: string,
  limit = 40
) {
  await connectDb();
  const logs = await AuditLog.find({ workspaceId })
    .sort({ createdAt: -1 })
    .limit(limit);

  return mapAuditLogs(logs);
}

function mapAuditLogs(logs: AuditLogDocument[]) {
  return logs.map((log) => {
    const doc = log as AuditLogDocument & { createdAt?: Date };
    return {
      id: log._id.toString(),
      action: log.action,
      plane: log.plane,
      workspaceId: log.workspaceId?.toString() ?? null,
      success: log.success,
      ip: log.ip,
      meta: log.meta,
      createdAt: doc.createdAt?.toISOString(),
    };
  });
}
