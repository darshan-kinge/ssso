import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { getPublicConfig } from "@/lib/config";
import { isAuthError } from "@/lib/auth/errors";
import {
  parseAuthorizeParams,
  completeAuthorization,
} from "@/lib/oauth/authorize";
import { buildAuthorizeQuery } from "@/lib/oauth/params";
import { validateOAuthClient } from "@/lib/oauth/apps";
import { assertAuthorizePkceForApp } from "@/lib/oauth/pkce-policy";
import { getOAuthSubjectFromRefreshCookie } from "@/lib/oauth/subject";
import { getResolvedTenantWorkspace } from "@/lib/workspace/request-context";
import { findWorkspaceById } from "@/lib/workspace/service";
import {
  isMultiTenantEnabled,
  tenantAuthUrl,
} from "@/lib/config/deployment";
import { findAppByClientId } from "@/lib/oauth/apps";
import { AuthorizePanel } from "@/components/oauth/AuthorizePanel";
import { resolveThemeSettings } from "@/lib/workspace/theme-resolver";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toSearchParams(
  raw: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params;
}

export default async function AuthorizePage({ searchParams }: PageProps) {
  const { app: brand, urls } = getPublicConfig();
  const raw = await searchParams;
  const query = toSearchParams(raw);

  if (!query.has("client_id") && !query.has("redirect_uri")) {
    redirect(urls.platformBase);
  }


  if (!isDbConfigured()) {
    return (
      <ErrorShell
        title="Not configured"
        message="Set MONGODB_URI and secrets in .env.local"
      />
    );
  }

  try {
    requireAuthSecrets();
    await connectDb();
  } catch {
    return (
      <ErrorShell
        title="Misconfigured"
        message="JWT_SECRET and REFRESH_PEPPER must be at least 32 characters."
      />
    );
  }

  let oauthParams;
  try {
    oauthParams = parseAuthorizeParams(query);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const code =
      msg === "unsupported_response_type"
        ? "Only response_type=code is supported"
        : msg === "unsupported_code_challenge_method"
          ? "Only code_challenge_method=S256 is supported"
          : "Missing or invalid OAuth parameters (client_id, redirect_uri, response_type=code)";
    return <ErrorShell title="Invalid request" message={code} />;
  }

  if (isMultiTenantEnabled()) {
    const { isTenantRequest } = await import("@/lib/workspace/tenant-host-server");
    const onPlatform = !(await isTenantRequest());

    if (onPlatform) {
      const app = await findAppByClientId(oauthParams.client_id);
      if (app?.workspaceId) {
        const ws = await findWorkspaceById(app.workspaceId.toString());
        if (ws) {
          redirect(
            `${tenantAuthUrl(ws.slug)}/authorize?${buildAuthorizeQuery(oauthParams)}`
          );
        }
      }
    }
  }

  const tenantWorkspace = isMultiTenantEnabled()
    ? await getResolvedTenantWorkspace()
    : null;
  const expectedWorkspaceId =
    tenantWorkspace?._id.toString() ??
    undefined;

  let app;
  let workspaceName: string | undefined;
  let workspaceSettings: { logoUrl?: string | null; primaryColor?: string | null; } | null | undefined = null;
  try {
    app = await validateOAuthClient(
      oauthParams.client_id,
      oauthParams.redirect_uri,
      expectedWorkspaceId
    );
    assertAuthorizePkceForApp(app, oauthParams);

    if (app.workspaceId) {
      const ws = await findWorkspaceById(app.workspaceId.toString());
      workspaceName = ws?.name;
      workspaceSettings = ws?.settings;
    }
  } catch (err) {
    const message = isAuthError(err)
      ? err.message
      : err instanceof Error
        ? err.message
        : "Unknown application";
    return <ErrorShell title="Application error" message={message} />;
  }

  const subject = await getOAuthSubjectFromRefreshCookie(expectedWorkspaceId);
  if (subject) {
    const redirectUrl = await completeAuthorization(subject, oauthParams);
    redirect(redirectUrl);
  }

  const theme = resolveThemeSettings(workspaceSettings);

  return (
    <div 
      className={`flex min-h-screen flex-col items-center justify-center p-6 ${theme.themeClass}`}
      style={theme.outerStyle}
    >
      <main className={theme.cardClass}>
        <AuthorizePanel
          brandName={brand.name}
          workspaceName={workspaceName}
          workspaceSettings={workspaceSettings}
          appName={app.name}
          params={oauthParams}
        />
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-bold text-[var(--foreground)] underline hover:text-[var(--accent)] transition"
          >
            ← Home
          </Link>
        </div>
      </main>
    </div>
  );
}

function ErrorShell({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <main className="w-full max-w-md rounded-none border-4 border-[var(--border)] bg-[var(--card)] p-8 shadow-[10px_10px_0px_0px_var(--border)] rotate-1">
        <h1 className="text-2xl font-black uppercase tracking-tight text-red-500">{title}</h1>
        <p className="mt-4 text-xs font-bold text-[var(--foreground)]/80 leading-relaxed bg-red-500/10 border-2 border-[var(--border)] p-3 shadow-[3px_3px_0px_0px_var(--border)]">
          {message}
        </p>
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-bold text-[var(--foreground)] underline hover:text-[var(--accent)] transition"
          >
            ← Home
          </Link>
        </div>
      </main>
    </div>
  );
}
