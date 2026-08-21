/** Shared tenant-host helpers (no next/headers — safe for client imports). */

export const PLATFORM_ONLY_PREFIXES = [
  "/dashboard",
  "/workspace",
  "/apps",
  "/invite",
] as const;

export function isPlatformOnlyPath(pathname: string): boolean {
  return PLATFORM_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
