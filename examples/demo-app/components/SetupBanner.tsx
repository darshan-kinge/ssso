import { getPublicEnv, isConfigured, isTenantMode } from "@/lib/config";

export function SetupBanner() {
  if (isConfigured()) {
    const { authUrl, workspaceSlug } = getPublicEnv();
    if (isTenantMode()) {
      return (
        <div className="border-b border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2 text-center text-xs text-[var(--muted)]">
          SaaS tenant: <code className="text-[var(--foreground)]">{authUrl}</code>
          {workspaceSlug && (
            <>
              {" "}
              (workspace <code>{workspaceSlug}</code>)
            </>
          )}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
      Configure Pulse: copy <code className="rounded bg-black/30 px-1">.env.example</code> to{" "}
      <code className="rounded bg-black/30 px-1">.env.local</code>. In SaaS mode set{" "}
      <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_AUTH_URL</code> to your{" "}
      <strong>tenant</strong> host (e.g.{" "}
      <code className="rounded bg-black/30 px-1">http://acme.localhost:3000</code>
      ), register a public app on OneAuth <code className="rounded bg-black/30 px-1">/dashboard</code>{" "}
      with redirect{" "}
      <code className="rounded bg-black/30 px-1">http://localhost:3001/callback</code>. See{" "}
      <code className="rounded bg-black/30 px-1">docs/SAAS-E2E.md</code>.
    </div>
  );
}
