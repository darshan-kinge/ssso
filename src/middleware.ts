import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveHost } from "@/lib/workspace/host";
import {
  HEADER_PLANE,
  HEADER_WORKSPACE_SLUG,
  HEADER_WORKSPACE_ID,
} from "@/lib/workspace/headers";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { isPlatformOnlyPath } from "@/lib/workspace/tenant-host";

const LANDING_DOMAIN = process.env.LANDING_DOMAIN ?? "ssso.in";

function isLandingRequest(request: NextRequest): boolean {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  // Production: exact landing domain (ssso.in)
  if (host === LANDING_DOMAIN) return true;
  // Dev: ?preview=landing on localhost
  if (
    host === "localhost" &&
    request.nextUrl.searchParams.get("preview") === "landing"
  )
    return true;
  return false;
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  // Serve landing page for ssso.in (or ?preview=landing in dev)
  if (isLandingRequest(request) && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/landing";
    return NextResponse.rewrite(url);
  }

  // Strip all incoming x-ssso-* headers to prevent spoofing
  requestHeaders.delete(HEADER_PLANE);
  requestHeaders.delete(HEADER_WORKSPACE_SLUG);
  requestHeaders.delete(HEADER_WORKSPACE_ID);

  if (isMultiTenantEnabled()) {
    const host = request.headers.get("host");
    const resolved = resolveHost(host);
    requestHeaders.set(HEADER_PLANE, resolved.plane);

    if (resolved.plane === "tenant" && resolved.slug) {
      requestHeaders.set(HEADER_WORKSPACE_SLUG, resolved.slug);

      if (isPlatformOnlyPath(request.nextUrl.pathname)) {
        const home = new URL("/", request.url);
        return NextResponse.redirect(home);
      }
    }
  } else {
    requestHeaders.set(HEADER_PLANE, "platform");
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
