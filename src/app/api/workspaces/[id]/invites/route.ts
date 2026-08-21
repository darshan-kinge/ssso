import { requireWorkspaceRole } from "@/lib/auth/request";
import {
  createWorkspaceInvite,
  listPendingInvites,
} from "@/lib/workspace/invites";
import { assertWorkspaceCollaborationEnabled } from "@/lib/workspace/guard";
import { createInviteSchema } from "@/lib/validators/workspace";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logAudit } from "@/lib/security/audit";
import type { MembershipRole } from "@/lib/models/Membership";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertWorkspaceCollaborationEnabled();
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();

    const { id: workspaceId } = await context.params;
    await requireWorkspaceRole(
      request.headers.get("authorization"),
      "viewer",
      workspaceId
    );

    const invites = await listPendingInvites(workspaceId);
    return jsonOk({ invites });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertWorkspaceCollaborationEnabled();
    if (!isDbConfigured()) {
      throw new AuthError("Database is not configured", 503, "misconfigured");
    }
    requireAuthSecrets();
    await connectDb();
    await enforceRateLimit(request, "email");

    const { id: workspaceId } = await context.params;
    const ctx = await requireWorkspaceRole(
      request.headers.get("authorization"),
      "admin",
      workspaceId
    );

    const body = await request.json();
    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      throw new AuthError(
        parsed.error.errors[0]?.message ?? "Invalid input",
        400,
        "validation_error"
      );
    }

    const invite = await createWorkspaceInvite(
      workspaceId,
      ctx.user._id.toString(),
      parsed.data.email,
      parsed.data.role as MembershipRole
    );

    await logAudit({
      action: "workspace.invite.create",
      request,
      success: true,
      userId: ctx.user._id.toString(),
      email: parsed.data.email,
      workspaceId,
      meta: { role: parsed.data.role, inviteId: invite.id },
    });

    return jsonOk({ invite }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
