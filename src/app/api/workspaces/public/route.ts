import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/mongoose";
import { getResolvedTenantWorkspace } from "@/lib/workspace/request-context";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { jsonOk, handleApiError } from "@/lib/api/response";
import { withAuthRoute } from "@/lib/api/with-auth-route";
import {
  applyCorsHeaders,
  isAllowedCorsOrigin,
} from "@/lib/security/cors";

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin || !(await isAllowedCorsOrigin(origin))) {
    return new NextResponse(null, { status: 204 });
  }
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return applyCorsHeaders(response, origin);
}

export const GET = withAuthRoute(async (request) => {
  const origin = request.headers.get("Origin");
  const corsOrigin = origin && (await isAllowedCorsOrigin(origin)) ? origin : null;

  try {
    await connectDb();
    
    const tenantWorkspace = isMultiTenantEnabled()
      ? await getResolvedTenantWorkspace()
      : null;

    if (!tenantWorkspace) {
      const res = jsonOk({
        multiTenant: false,
        name: "SSSO",
        settings: {
          loginMode: "open"
        }
      });
      return applyCorsHeaders(res, corsOrigin);
    }

    const res = jsonOk({
      multiTenant: true,
      id: tenantWorkspace._id.toString(),
      slug: tenantWorkspace.slug,
      name: tenantWorkspace.name,
      settings: {
        logoUrl: tenantWorkspace.settings?.logoUrl ?? null,
        primaryColor: tenantWorkspace.settings?.primaryColor ?? null,
        themeType: tenantWorkspace.settings?.themeType ?? "neo-brutalist",
        loginMode: tenantWorkspace.settings?.loginMode ?? "open",
      }
    });
    return applyCorsHeaders(res, corsOrigin);
  } catch (err) {
    const res = handleApiError(err);
    return applyCorsHeaders(res, corsOrigin);
  }
});
