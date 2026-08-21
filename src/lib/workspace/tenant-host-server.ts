import { headers } from "next/headers";
import { resolveHost } from "./host";

/** Server: current request is on a tenant subdomain. */
export async function isTenantRequest(): Promise<boolean> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return false;
  return resolveHost(host).plane === "tenant";
}
