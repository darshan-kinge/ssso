import Link from "next/link";
import { getPublicConfig } from "@/lib/config";
import { AuthForm } from "@/components/auth/AuthForm";
import { getOAuthReturnPath } from "@/components/oauth/OAuthReturn";
import { isMultiTenantEnabled } from "@/lib/config/deployment";
import { getResolvedTenantWorkspace } from "@/lib/workspace/request-context";
import { resolveThemeSettings } from "@/lib/workspace/theme-resolver";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const { app } = getPublicConfig();
  
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

  const theme = resolveThemeSettings(tenantWorkspace?.settings);
  const onTenant = isMultiTenantEnabled() && !!tenantWorkspace;
  const ssoOnly = onTenant && tenantWorkspace?.settings?.loginMode === "sso-only";

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
            Registration is only available through a connected application.
            Please open the app and follow its sign-up flow.
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
          {tenantWorkspace 
            ? `Create your ${tenantWorkspace.name} account` 
            : `Create your ${app.name} account`}
        </h1>
        <p className="auth-info-box mt-2 text-sm text-[var(--foreground)]/70 leading-relaxed p-3 bg-slate-50 border border-slate-100 rounded-lg">
          One account for all your projects.
        </p>
        <AuthForm
          mode="signup"
          oauthReturn={oauthReturn}
          inviteToken={inviteToken}
        />
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href={oauthReturn ? `/login?${params.toString()}` : "/login"}
            className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors"
          >
            Sign in
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
