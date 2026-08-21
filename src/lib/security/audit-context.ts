import type { RequestPlane } from "@/lib/config/deployment";
import {
  HEADER_PLANE,
  HEADER_WORKSPACE_SLUG,
} from "@/lib/workspace/headers";
import { findWorkspaceBySlug } from "@/lib/workspace/service";

export interface ResolvedAuditContext {
  plane: RequestPlane;
  workspaceId?: string;
}

/** Resolve plane + workspace from request headers (set by middleware). */
export async function resolveAuditContext(
  request: Request
): Promise<ResolvedAuditContext> {
  const planeHeader = request.headers.get(HEADER_PLANE);
  const plane: RequestPlane = planeHeader === "tenant" ? "tenant" : "platform";

  const slug = request.headers.get(HEADER_WORKSPACE_SLUG);
  if (plane === "tenant" && slug) {
    const ws = await findWorkspaceBySlug(slug);
    if (ws) {
      return { plane, workspaceId: ws._id.toString() };
    }
  }

  return { plane };
}
