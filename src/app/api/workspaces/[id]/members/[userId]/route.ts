import { requireWorkspaceRole } from "@/lib/auth/request";
import {
  removeWorkspaceMember,
  updateMemberRole,
} from "@/lib/workspace/members";
import { assertWorkspaceCollaborationEnabled } from "@/lib/workspace/guard";
import { updateMemberRoleSchema } from "@/lib/validators/workspace";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { logAudit } from "@/lib/security/audit";
import type { MembershipRole } from "@/lib/models/Membership";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    assertWorkspaceCollaborationEnabled();
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { id: workspaceId, userId } = await context.params;
    const ctx = await requireWorkspaceRole(
      request.headers.get("authorization"),
      "admin",
      workspaceId
    );

    const body = await request.json();
    const parsed = updateMemberRoleSchema.safeParse(body);
    if (!parsed.success) {
      throw new AuthError(
        parsed.error.errors[0]?.message ?? "Invalid input",
        400,
        "validation_error"
      );
    }

    await updateMemberRole(
      workspaceId,
      ctx.user._id.toString(),
      userId,
      parsed.data.role as MembershipRole
    );

    await logAudit({
      action: "workspace.member.role_change",
      request,
      success: true,
      userId: ctx.user._id.toString(),
      workspaceId,
      meta: { targetUserId: userId, role: parsed.data.role },
    });

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    assertWorkspaceCollaborationEnabled();
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { id: workspaceId, userId } = await context.params;
    const ctx = await requireWorkspaceRole(
      request.headers.get("authorization"),
      "admin",
      workspaceId
    );

    await removeWorkspaceMember(
      workspaceId,
      ctx.user._id.toString(),
      userId
    );

    await logAudit({
      action: "workspace.member.remove",
      request,
      success: true,
      userId: ctx.user._id.toString(),
      workspaceId,
      meta: { targetUserId: userId },
    });

    return jsonOk({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
