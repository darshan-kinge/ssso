import { NextResponse } from "next/server";
import { getConfig, getPublicConfig, isEmailConfigured } from "@/lib/config";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";

export async function GET() {
  const config = getConfig();
  const publicConfig = getPublicConfig();

  let database: "connected" | "not_configured" | "error" = "not_configured";

  if (isDbConfigured()) {
    try {
      await connectDb();
      database = "connected";
    } catch {
      database = "error";
    }
  }

  const secretsConfigured = {
    jwtSecret: Boolean(config.secrets.jwtSecret),
    refreshPepper: Boolean(config.secrets.refreshPepper),
  };

  return NextResponse.json({
    status: "ok",
    app: publicConfig.app.name,
    database,
    secretsConfigured,
    email: isEmailConfigured() ? "resend" : "console",
    requireEmailVerification: publicConfig.features.requireEmailVerification,
    rateLimitEnabled: config.features.rateLimitEnabled,
    auditLogEnabled: config.features.auditLogEnabled,
    authUrl: publicConfig.urls.authBase,
  });
}
