import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/mongoose";
import { App } from "@/lib/models/App";

function originsFromRedirectUrls(urls: string[]): string[] {
  const set = new Set<string>();
  for (const url of urls) {
    try {
      set.add(new URL(url).origin);
    } catch {
      /* skip invalid */
    }
  }
  return [...set];
}

export async function isAllowedCorsOrigin(origin: string): Promise<boolean> {
  await connectDb();
  const apps = await App.find({}).select("redirectUrls").lean();
  for (const app of apps) {
    const origins = originsFromRedirectUrls(
      (app.redirectUrls as string[]) ?? []
    );
    if (origins.includes(origin)) return true;
  }
  return false;
}

export async function corsOriginForClient(
  request: Request,
  clientId: string
): Promise<string | null> {
  const origin = request.headers.get("Origin");
  if (!origin) return null;

  await connectDb();
  const app = await App.findOne({ clientId }).select("redirectUrls").lean();
  if (!app) return null;

  const allowed = originsFromRedirectUrls(
    (app.redirectUrls as string[]) ?? []
  );
  return allowed.includes(origin) ? origin : null;
}

export function applyCorsHeaders(
  response: NextResponse,
  allowedOrigin: string | null
): NextResponse {
  if (!allowedOrigin) return response;

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Vary", "Origin");
  return response;
}
