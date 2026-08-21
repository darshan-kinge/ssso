import { getPublicConfig } from "@/lib/config";

/** Client: browser is on a tenant auth host (not platform dashboard). */
export function isTenantAuthHostClient(): boolean {
  if (typeof window === "undefined") return false;

  const { deployment, urls } = getPublicConfig();
  if (!deployment.multiTenant) return false;

  try {
    const platformHost = new URL(urls.platformBase).host;
    return window.location.host !== platformHost;
  } catch {
    return false;
  }
}
