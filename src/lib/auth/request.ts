import { headers } from "next/headers";
import { connectDb } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { verifyAccessToken } from "./tokens";
import { AuthError } from "./errors";
import { toPublicUser } from "./session";
import { requireMembership } from "@/lib/workspace/service";
import { isMultiTenantEnabled, isSaasMode } from "@/lib/config/deployment";
import type { MembershipRole } from "@/lib/models/Membership";

export async function getDeviceLabel(): Promise<string> {
  const h = await headers();
  const ua = h.get("user-agent");
  return ua?.slice(0, 200) ?? "unknown";
}

export function getBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

export async function getAuthenticatedPlatformUser(authorization: string | null) {
  const token = getBearerToken(authorization);
  if (!token) {
    throw new AuthError("Missing access token", 401, "unauthorized");
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AuthError("Invalid or expired access token", 401, "invalid_token");
  }

  if (payload.type === "end_user") {
    throw new AuthError("Platform token required", 403, "forbidden");
  }

  await connectDb();
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AuthError("User not found", 401, "user_not_found");
  }

  let workspaceId = payload.workspace_id ?? null;
  let role = (payload.role as MembershipRole | undefined) ?? null;

  if (isMultiTenantEnabled()) {
    if (!workspaceId && !isSaasMode()) {
      const { ensureDefaultWorkspace } = await import("@/lib/workspace/service");
      const ws = await ensureDefaultWorkspace(user._id.toString(), user.email);
      workspaceId = ws._id.toString();
      const membership = await requireMembership(
        user._id.toString(),
        workspaceId,
        "viewer"
      );
      role = membership.role;
    } else if (workspaceId) {
      const membership = await requireMembership(
        user._id.toString(),
        workspaceId,
        "viewer"
      );
      role = membership.role;
    }
  }

  return {
    user,
    accessToken: token,
    publicUser: toPublicUser(user),
    workspaceId,
    role,
  };
}

/** @deprecated Use getAuthenticatedPlatformUser */
export async function getAuthenticatedUser(authorization: string | null) {
  const result = await getAuthenticatedPlatformUser(authorization);
  return {
    user: result.user,
    accessToken: result.accessToken,
    publicUser: result.publicUser,
  };
}

export async function requireWorkspaceRole(
  authorization: string | null,
  minimum: MembershipRole,
  expectedWorkspaceId?: string
) {
  const ctx = await getAuthenticatedPlatformUser(authorization);
  if (!ctx.workspaceId || !ctx.role) {
    throw new AuthError("No active workspace", 400, "no_workspace");
  }
  if (expectedWorkspaceId && ctx.workspaceId !== expectedWorkspaceId) {
    throw new AuthError("Workspace access denied", 403, "forbidden");
  }
  const { hasMinimumRole } = await import("@/lib/workspace/service");
  if (!hasMinimumRole(ctx.role, minimum)) {
    throw new AuthError("Insufficient permissions", 403, "forbidden");
  }
  return ctx;
}
