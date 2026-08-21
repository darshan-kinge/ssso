import { getConfig } from "./index";

export type DeploymentMode = "personal" | "saas";
export type RequestPlane = "platform" | "tenant";

export function getDeploymentMode(): DeploymentMode {
  return getConfig().deployment.mode;
}

export function isMultiTenantEnabled(): boolean {
  return getConfig().features.multiTenant;
}

export function isSaasMode(): boolean {
  return isMultiTenantEnabled() && getDeploymentMode() === "saas";
}

/** Workspaces, members, invites (SaaS or multi-tenant flag). */
export function isWorkspaceCollaborationEnabled(): boolean {
  return isMultiTenantEnabled() || getDeploymentMode() === "saas";
}

export function getPlatformBaseUrl(): string {
  const c = getConfig();
  return (
    c.urls.platformBase?.replace(/\/$/, "") ??
    c.urls.authBase.replace(/\/$/, "")
  );
}

export function getTenantDomainSuffix(): string {
  return getConfig().deployment.tenantDomainSuffix;
}

/** Build tenant auth base URL for a workspace slug */
export function tenantAuthUrl(slug: string): string {
  const suffix = getTenantDomainSuffix();
  const isLocal = suffix.includes("localhost");
  if (isLocal) {
    return `http://${slug}.${suffix}`;
  }
  return `https://${slug}.${suffix}`;
}
