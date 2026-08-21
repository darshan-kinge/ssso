import Link from "next/link";
import { headers } from "next/headers";
import { getPublicConfig } from "@/lib/config";
import { AuthForm } from "@/components/auth/AuthForm";
import { getOAuthReturnPath } from "@/components/oauth/OAuthReturn";
import { resolveHost } from "@/lib/workspace/host";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { getResolvedTenantWorkspace } from "@/lib/workspace/request-context";
import { resolveThemeSettings } from "@/lib/workspace/theme-resolver";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { app } = getPublicConfig();
  const h = await headers();
  const onTenant =
    isMultiTenantEnabled() && resolveHost(h.get("host")).plane === "tenant";

  const tenantWorkspace = isMultiTenantEnabled()
    ? await getResolvedTenantWorkspace()
    : null;

  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
  }
  const oauthReturn = getOAuthReturnPath(params);
  const inviteToken =
    typeof raw.invite === "string" ? raw.invite : null;
  const resetSuccess = raw.reset === "success";

  const theme = resolveThemeSettings(tenantWorkspace?.settings);
  const ssoOnly = onTenant && tenantWorkspace?.settings?.loginMode === "sso-only";

  // SSO-only: block direct access (no oauth return)
  if (ssoOnly && !oauthReturn) {
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center p-6 ${theme.themeClass}`}
        style={theme.outerStyle}
      >
        <main className={theme.cardClass}>
          {tenantWorkspace?.settings?.logoUrl && (
            <div className="mb-6 flex justify-center">
              <img
                src={tenantWorkspace.settings.logoUrl}
                alt={`${tenantWorkspace.name} logo`}
                className="auth-logo-img max-h-12 max-w-full object-contain p-1"
              />
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            {tenantWorkspace?.name ?? app.name}
          </h1>
          <p className="auth-info-box mt-4 text-sm text-[var(--foreground)]/70 leading-relaxed p-4">
            Sign-in is only available through a connected application.
            Please open the app and use the &ldquo;Sign in&rdquo; button there.
          </p>
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              ← Back home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div 
      className={`flex min-h-screen flex-col items-center justify-center p-6 ${theme.themeClass}`}
      style={theme.outerStyle}
    >
      <main className={theme.cardClass}>
        {tenantWorkspace?.settings?.logoUrl ? (
          <div className="mb-6 flex justify-center">
            <img
              src={tenantWorkspace.settings.logoUrl}
              alt={`${tenantWorkspace.name} logo`}
              className="auth-logo-img max-h-16 max-w-full object-contain p-2"
            />
          </div>
        ) : null}

        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          {onTenant && oauthReturn
            ? "Sign in to continue"
            : onTenant && tenantWorkspace
              ? `Sign in to ${tenantWorkspace.name}`
              : `Sign in to ${app.name}`}
        </h1>
        {resetSuccess && (
          <p className="mt-2 text-sm font-medium text-emerald-600">
            Password updated. Sign in with your new password.
          </p>
        )}
        <p className="auth-info-box mt-4 text-sm text-[var(--foreground)]/70 leading-relaxed p-4 bg-slate-50 border border-slate-100 rounded-lg">
          {oauthReturn
            ? onTenant
              ? "Use your account for this application. This is not the platform operator dashboard."
              : "Sign in to continue to the requesting application."
            : onTenant
              ? "End-user sign-in for apps using this workspace."
              : `Use your ${app.name} account across all connected apps.`}
        </p>
        <AuthForm
          mode="login"
          oauthReturn={oauthReturn}
          inviteToken={inviteToken}
        />
        <p className="mt-6 text-center text-sm text-slate-500">
          No account?{" "}
          <Link
            href={oauthReturn ? `/signup?${params.toString()}` : "/signup"}
            className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors"
          >
            Sign up
          </Link>
        </p>
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Home
          </Link>
        </div>
      </main>
    </div>
  );
}
