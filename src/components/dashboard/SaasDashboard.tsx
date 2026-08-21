"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getPublicConfig } from "@/lib/config";
import { CopyButton } from "@/components/ui/CopyButton";
import { useWorkspace, type WorkspaceSummary } from "@/components/workspace/useWorkspace";
import { authFetch } from "@/lib/auth/api-client";
import { buildTenantAuthUrl, buildTenantHostLabel } from "@/lib/workspace/tenant-url";

import { AppsManager } from "@/components/apps/AppsManager";
import { EndUsersManager } from "@/components/workspace/EndUsersManager";
import { MembersManager } from "@/components/workspace/MembersManager";
import { SessionsPanel } from "@/components/dashboard/SessionsPanel";
import { AuditPanel } from "@/components/dashboard/AuditPanel";

// ============================================
// MAIN EXPORT — tab router
// ============================================
export function SaasDashboard() {
  const { deployment, urls } = getPublicConfig();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const { active, loading, error, reload } = useWorkspace();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading workspace…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-xl text-sm flex items-center justify-between">
        <span>{error}</span>
        <Link href="/login" className="text-indigo-600 hover:underline font-semibold">
          Sign in
        </Link>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-lg mx-auto text-center space-y-5 mt-10">
        <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">No workspace yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create a workspace with your own auth subdomain to register apps and invite your team.
          </p>
        </div>
        <Link
          href="/dashboard/workspace/new"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Create workspace
        </Link>
      </div>
    );
  }

  const tenantUrl = buildTenantAuthUrl(active.slug, deployment.tenantDomainSuffix);
  const tenantHost = buildTenantHostLabel(active.slug, deployment.tenantDomainSuffix);
  const platformBase = urls.platformBase?.replace(/\/$/, "") ?? "";

  return (
    <div>
      {tab === "overview" && (
        <OverviewTab
          active={active}
          tenantUrl={tenantUrl}
          tenantHost={tenantHost}
          platformBase={platformBase}
        />
      )}

      {tab === "apps" && (
        <SectionShell title="Applications" desc="Configure OAuth client applications for Single Sign-On.">
          <AppsManager tenantAuthOrigin={tenantUrl} />
        </SectionShell>
      )}

      {tab === "users" && (
        <SectionShell title="Users" desc="Manage end users registered on your tenant.">
          <EndUsersManager workspaceId={active.id} myRole={active.role} />
        </SectionShell>
      )}

      {tab === "members" && (
        <SectionShell title="Members" desc="Manage team collaborators and pending invitations.">
          <MembersManager workspaceId={active.id} myRole={active.role} />
        </SectionShell>
      )}

      {tab === "sessions" && (
        <SectionShell title="Sessions" desc="Active device authorizations and sign-out controls.">
          <SessionsPanel />
        </SectionShell>
      )}

      {tab === "audit-logs" && (
        <SectionShell title="Audit Logs" desc="Trace credential operations, updates, and login requests.">
          <AuditPanel />
        </SectionShell>
      )}

      {tab === "settings" && (
        <SettingsTab active={active} reload={reload} />
      )}
    </div>
  );
}

// ============================================
// HELPER — section wrapper
// ============================================
function SectionShell({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
      {children}
    </div>
  );
}

// ============================================
// 1. OVERVIEW TAB
// ============================================
function OverviewTab({
  active,
  tenantUrl,
  tenantHost,
  platformBase,
}: {
  active: WorkspaceSummary;
  tenantUrl: string;
  tenantHost: string;
  platformBase: string;
}) {
  const [appsCount, setAppsCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [guideTab, setGuideTab] = useState<"endpoints" | "nextjs" | "react">("endpoints");

  useEffect(() => {
    authFetch(`/api/workspaces/${active.id}/users?pageSize=1`)
      .then((r) => r.json())
      .then((d) => setUsersCount(d.total ?? 0))
      .catch(() => {});

    authFetch(`/api/workspaces/${active.id}/apps`)
      .then((r) => r.json())
      .then((d) => setAppsCount(Array.isArray(d) ? d.length : d.total ?? 0))
      .catch(() => {});
  }, [active.id]);

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">{active.name}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Subdomain: <code className="font-mono text-xs bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">{active.slug}</code>
            <span className="mx-2 text-slate-300">·</span>
            Plan: <span className="font-semibold text-slate-700 uppercase text-xs">{active.plan}</span>
          </p>
        </div>
        <Link
          href="/dashboard?tab=apps"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create OAuth App
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Users</span>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">
            {usersCount !== null ? usersCount : <span className="text-slate-300 text-lg">—</span>}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">registered on tenant</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Applications</span>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">
            {appsCount !== null ? appsCount : <span className="text-slate-300 text-lg">—</span>}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">OAuth apps registered</p>
        </div>
      </div>

      {/* Tenant endpoint card + integration guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tenant Auth Endpoint */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Tenant Auth Endpoint</h3>
            <p className="text-xs text-slate-400 mt-0.5">Public authorize URL for your tenant.</p>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Base Host</span>
              <code className="text-xs font-mono text-slate-700 select-all break-all">{tenantHost}</code>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Authorize URL</span>
              <code className="text-xs font-mono text-slate-700 select-all break-all">{tenantUrl}</code>
            </div>
          </div>
          <div className="flex gap-2">
            <CopyButton value={tenantUrl} />
            <a
              href={tenantUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Test Sign-In
            </a>
          </div>
        </div>

        {/* Developer Integration Guide */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Integration Guide</h3>
            <p className="text-xs text-slate-400 mt-0.5">Integrate SSSO OAuth flows into your app.</p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex gap-1">
              {(["endpoints", "nextjs", "react"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setGuideTab(id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                    guideTab === id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {id === "endpoints" ? "Endpoints" : id === "nextjs" ? "Node.js SDK" : "React PKCE"}
                </button>
              ))}
            </div>

            <div className="p-4 bg-white">
              {guideTab === "endpoints" && (
                <div className="space-y-2.5 text-xs">
                  {[
                    { label: "Authorization Endpoint", val: `${tenantUrl}/authorize` },
                    { label: "Token Exchange", val: `${platformBase}/api/oauth/token` },
                    { label: "User Profile", val: `${platformBase}/api/oauth/userinfo` },
                  ].map((ep) => (
                    <div key={ep.label}>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">{ep.label}</span>
                      <code className="block bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded font-mono text-slate-700 select-all break-all">{ep.val}</code>
                    </div>
                  ))}
                </div>
              )}

              {guideTab === "nextjs" && (
                <pre className="bg-slate-50 border border-slate-100 p-3 rounded-lg font-mono text-[10px] text-slate-600 overflow-x-auto leading-relaxed select-all">{`import { SssoClient } from "@ssso/node";

const client = new SssoClient({
  clientId: "YOUR_CLIENT_ID",
  clientSecret: "YOUR_CLIENT_SECRET",
  authOrigin: "${tenantUrl.replace(/\/$/, "")}",
  platformBase: "${platformBase}",
});`}</pre>
              )}

              {guideTab === "react" && (
                <pre className="bg-slate-50 border border-slate-100 p-3 rounded-lg font-mono text-[10px] text-slate-600 overflow-x-auto leading-relaxed select-all">{`<SssoProvider
  clientId="YOUR_CLIENT_ID"
  authOrigin="${tenantUrl.replace(/\/$/, "")}"
  platformBase="${platformBase}"
  redirectUri="YOUR_CALLBACK_URL"
>
  <YourApp />
</SssoProvider>`}</pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 2. SETTINGS TAB — Branding + General merged
// ============================================
function SettingsTab({
  active,
  reload,
}: {
  active: WorkspaceSummary;
  reload: () => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Configure branding, auth behavior, and workspace details.</p>
      </div>
      {/* Branding section */}
      <BrandingSection active={active} reload={reload} />
      {/* General + Danger zone */}
      <GeneralSection active={active} reload={reload} />
    </div>
  );
}

// ============================================
// 2a. BRANDING & AUTH SETTINGS
// ============================================
function BrandingSection({
  active,
  reload,
}: {
  active: WorkspaceSummary;
  reload: () => Promise<void>;
}) {
  const [logoUrl, setLogoUrl] = useState(active.settings?.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(active.settings?.primaryColor ?? "");
  const [themeType, setThemeType] = useState(active.settings?.themeType ?? "simple-bg");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(active.settings?.backgroundImageUrl ?? "");
  const [backgroundColor, setBackgroundColor] = useState(active.settings?.backgroundColor ?? "");
  const [customCardBg, setCustomCardBg] = useState(active.settings?.customCardBg ?? "");
  const [customCardBorder, setCustomCardBorder] = useState(active.settings?.customCardBorder ?? "");
  const [customCardText, setCustomCardText] = useState(active.settings?.customCardText ?? "");
  const [customButtonBg, setCustomButtonBg] = useState(active.settings?.customButtonBg ?? "");
  const [customButtonText, setCustomButtonText] = useState(active.settings?.customButtonText ?? "");
  const [loginMode, setLoginMode] = useState<"open" | "sso-only">(active.settings?.loginMode ?? "open");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLogoUrl(active.settings?.logoUrl ?? "");
    setPrimaryColor(active.settings?.primaryColor ?? "");
    setThemeType(active.settings?.themeType ?? "simple-bg");
    setBackgroundImageUrl(active.settings?.backgroundImageUrl ?? "");
    setBackgroundColor(active.settings?.backgroundColor ?? "");
    setCustomCardBg(active.settings?.customCardBg ?? "");
    setCustomCardBorder(active.settings?.customCardBorder ?? "");
    setCustomCardText(active.settings?.customCardText ?? "");
    setCustomButtonBg(active.settings?.customButtonBg ?? "");
    setCustomButtonText(active.settings?.customButtonText ?? "");
    setLoginMode(active.settings?.loginMode ?? "open");
    setSuccess(false);
    setError(null);
  }, [active]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      const res = await authFetch(`/api/workspaces/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            logoUrl: logoUrl.trim() || null,
            primaryColor: primaryColor.trim() || null,
            themeType,
            backgroundImageUrl: backgroundImageUrl.trim() || null,
            backgroundColor: backgroundColor.trim() || null,
            customCardBg: customCardBg.trim() || null,
            customCardBorder: customCardBorder.trim() || null,
            customCardText: customCardText.trim() || null,
            customButtonBg: customButtonBg.trim() || null,
            customButtonText: customButtonText.trim() || null,
            loginMode,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to update settings"); return; }
      setSuccess(true);
      await reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const Field = ({ label, id, value, onChange, placeholder }: { label: string; id: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-300"
      />
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-1">Branding & Auth</h3>
      <p className="text-xs text-slate-400 mb-5">Customize the login screen appearance and authentication mode.</p>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Logo + colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Logo URL" id="logo-url" value={logoUrl} onChange={setLogoUrl} placeholder="https://…/logo.png" />
          <Field label="Primary Color" id="primary-color" value={primaryColor} onChange={setPrimaryColor} placeholder="#4f46e5" />
        </div>

        {/* Theme type */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Login Page Theme</label>
          <select
            value={themeType}
            onChange={(e) => setThemeType(e.target.value)}
            className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option value="simple-bg">Simple Background</option>
            <option value="neo-brutalist">Neo-Brutalist</option>
            <option value="custom-colors">Custom Colors</option>
          </select>
        </div>

        {/* Background */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Background Color" id="bg-color" value={backgroundColor} onChange={setBackgroundColor} placeholder="#f8fafc" />
          <Field label="Background Image URL" id="bg-image" value={backgroundImageUrl} onChange={setBackgroundImageUrl} placeholder="https://…" />
        </div>

        {/* Custom card colors (shown when custom-colors) */}
        {themeType === "custom-colors" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1 border-t border-slate-100">
            <Field label="Card Background" id="card-bg" value={customCardBg} onChange={setCustomCardBg} placeholder="#ffffff" />
            <Field label="Card Border" id="card-border" value={customCardBorder} onChange={setCustomCardBorder} placeholder="#e2e8f0" />
            <Field label="Card Text" id="card-text" value={customCardText} onChange={setCustomCardText} placeholder="#1f2937" />
            <Field label="Button Background" id="btn-bg" value={customButtonBg} onChange={setCustomButtonBg} placeholder="#4f46e5" />
            <Field label="Button Text" id="btn-text" value={customButtonText} onChange={setCustomButtonText} placeholder="#ffffff" />
          </div>
        )}
        {/* Login mode */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Login Mode</label>
          <select
            value={loginMode}
            onChange={(e) => setLoginMode(e.target.value as "open" | "sso-only")}
            className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option value="open">Open — anyone can register</option>
            <option value="sso-only">SSO Only — invite / OAuth redirect required</option>
          </select>
          <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 text-xs text-slate-500 leading-normal">
            <p>
              <strong>Open (Default):</strong> End-users can visit the subdomain login or sign-up page directly and create accounts. Recommended for open client-facing products.
            </p>
            <p>
              <strong>SSO Only:</strong> Direct registration is blocked. Direct visits to <code>/login</code> or <code>/signup</code> display an access denied message. Users can only authenticate if invited by an administrator via the <em>Members</em> tab, or if they are initiated through a client application&apos;s OAuth flow.
            </p>
          </div>
        </div>
        {error && <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">Branding saved successfully.</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Branding"}
        </button>
      </form>
    </div>
  );
}

// ============================================
// 2b. GENERAL SETTINGS + DANGER ZONE
// ============================================
function GeneralSection({
  active,
  reload,
}: {
  active: WorkspaceSummary;
  reload: () => Promise<void>;
}) {
  const router = useRouter();
  const [name, setName] = useState(active.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await authFetch(`/api/workspaces/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error ?? "Failed to update"); return; }
      setSuccess(true);
      await reload();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete workspace "${active.name}"? All OAuth clients and user records will be permanently destroyed.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/workspaces/${active.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to delete workspace");
        setLoading(false);
        return;
      }
      localStorage.removeItem("ssso_active_workspace");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">General</h3>
        <p className="text-xs text-slate-400">Rename your workspace or view read-only identifiers.</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="ws-name" className="block text-xs font-semibold text-slate-600 mb-1">Workspace Name</label>
          <input
            id="ws-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tenant Subdomain</label>
          <input
            type="text"
            disabled
            value={active.slug}
            className="w-full border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-400 rounded-lg cursor-not-allowed"
          />
          <p className="mt-1 text-[10px] text-slate-400">Subdomains cannot be changed after creation to avoid breaking OIDC clients.</p>
        </div>

        {error && <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">Workspace updated.</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </form>

      {/* Danger zone */}
      {active.role === "owner" && (
        <div className="border-t border-red-100 pt-6">
          <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Danger Zone</h4>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Permanently deletes this workspace including all OAuth clients, secrets, audit logs, and collaborator access. This cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            Delete Workspace Permanently
          </button>
        </div>
      )}
    </div>
  );
}
