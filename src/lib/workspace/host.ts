import { getConfig } from "@/lib/config";
import {
  getPlatformBaseUrl,
  getTenantDomainSuffix,
  isMultiTenantEnabled,
  type RequestPlane,
} from "@/lib/config/deployment";

export interface HostResolution {
  plane: RequestPlane;
  slug: string | null;
  hostname: string;
}

function stripPort(host: string): string {
  return host.split(":")[0] ?? host;
}

export function resolveHost(hostHeader: string | null): HostResolution {
  const host = (hostHeader ?? "localhost").toLowerCase();
  const hostname = stripPort(host);

  if (!isMultiTenantEnabled()) {
    return { plane: "platform", slug: null, hostname };
  }

  const suffix = getTenantDomainSuffix().toLowerCase();
  const suffixHost = stripPort(suffix);

  // acme.localhost or acme.ssso.in
  if (hostname.endsWith(`.${suffixHost}`) || host.endsWith(`.${suffix}`)) {
    const fullSuffix = host.includes(":") ? suffix : suffixHost;
    const prefix = host.replace(`.${fullSuffix}`, "");
    const slug = prefix.split(".")[0] || null;
    if (slug && slug !== "app" && slug !== "www") {
      return { plane: "tenant", slug, hostname };
    }
  }

  const platformUrl = new URL(getPlatformBaseUrl());
  const platformHost = stripPort(platformUrl.host);

  if (hostname === platformHost || hostname === "app") {
    return { plane: "platform", slug: null, hostname };
  }

  const authUrl = new URL(getConfig().urls.authBase);
  if (hostname === stripPort(authUrl.host) && getConfig().deployment.mode === "personal") {
    return { plane: "platform", slug: null, hostname };
  }

  return { plane: "platform", slug: null, hostname };
}

export function isReservedSlug(slug: string): boolean {
  return getConfig().deployment.reservedSlugs.includes(slug.toLowerCase());
}
