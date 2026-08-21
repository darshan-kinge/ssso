import { headers } from "next/headers";
import type { RequestPlane } from "@/lib/config/deployment";
import type { WorkspaceDocument } from "@/lib/models/Workspace";
import { findWorkspaceBySlug, findWorkspaceById } from "./service";
import {
  HEADER_PLANE,
  HEADER_WORKSPACE_SLUG,
  HEADER_WORKSPACE_ID,
} from "./headers";

export {
  HEADER_PLANE,
  HEADER_WORKSPACE_SLUG,
  HEADER_WORKSPACE_ID,
} from "./headers";

export async function getRequestPlane(): Promise<RequestPlane> {
  const h = await headers();
  const plane = h.get(HEADER_PLANE);
  return plane === "tenant" ? "tenant" : "platform";
}

export async function getWorkspaceSlugFromHeaders(): Promise<string | null> {
  const h = await headers();
  return h.get(HEADER_WORKSPACE_SLUG);
}

export async function getResolvedTenantWorkspace(): Promise<WorkspaceDocument | null> {
  const h = await headers();
  const id = h.get(HEADER_WORKSPACE_ID);
  if (id) return findWorkspaceById(id);

  const slug = await getWorkspaceSlugFromHeaders();
  if (!slug) return null;
  return findWorkspaceBySlug(slug);
}

