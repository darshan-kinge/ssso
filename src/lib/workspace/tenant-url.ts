/** Build tenant auth host URL (client-safe; suffix from public config). */
export function buildTenantAuthUrl(
  slug: string,
  tenantDomainSuffix: string
): string {
  const suffix = tenantDomainSuffix.replace(/\/$/, "");
  const isLocal = suffix.includes("localhost");
  if (isLocal) {
    return `http://${slug}.${suffix}`;
  }
  return `https://${slug}.${suffix}`;
}

export function buildTenantHostLabel(
  slug: string,
  tenantDomainSuffix: string
): string {
  return `${slug}.${tenantDomainSuffix.replace(/\/$/, "")}`;
}
