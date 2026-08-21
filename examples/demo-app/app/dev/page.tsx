"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SssoClient } from "@ssso/core";
import { useAuth } from "@ssso/react";
import { getPublicEnv } from "@/lib/config";
import { ApiTester } from "@/components/ApiTester";

/** Developer reference — how Pulse integrates OneAuth SDKs */
export default function DevPage() {
  const env = getPublicEnv();
  const { token: ctxToken } = useAuth();
  const client = useMemo(
    () =>
      new SssoClient({
        authUrl: env.authUrl,
        clientId: env.clientId,
        redirectUri: env.redirectUri,
        storageKey: "ssso_demo_core_token",
        usePkce: true,
      }),
    [env.authUrl, env.clientId, env.redirectUri]
  );

  const [authorizeUrl, setAuthorizeUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    void client.buildAuthorizeUrl("dev-state").then((url) => {
      if (!cancelled) setAuthorizeUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [client, ctxToken]);

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <p className="text-sm text-[var(--accent)]">For integrators</p>
        <h1 className="mt-1 text-2xl font-bold">SSSO integration</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Pulse is a realistic consumer app built on the same patterns you would
          use in production. This page documents the SDK wiring behind the UI.
        </p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3 text-sm">
        <h2 className="font-medium">Stack in this repo</h2>
        <ul className="list-inside list-disc space-y-1 text-[var(--muted)]">
          <li>
            <code className="text-[var(--fg)]">@ssso/react</code> — AuthProvider,
            useAuth, ProtectedRoute
          </li>
          <li>
            <code className="text-[var(--fg)]">@ssso/core</code> — PKCE login,
            token decode
          </li>
          <li>
            <code className="text-[var(--fg)]">@ssso/node</code> —{" "}
            verifyAccessToken on /api/*
          </li>
        </ul>
        <p className="text-[var(--muted)]">
          OneAuth docs in this monorepo: <code>docs/SDK.md</code>,{" "}
          <code>docs/OAUTH.md</code>.
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-medium">Protected API tester</h2>
        <div className="mt-4">
          <ApiTester />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
        <h2 className="font-medium">Sample authorize URL (PKCE)</h2>
        <p className="break-all font-mono text-xs text-[var(--muted)]">
          {authorizeUrl || "…"}
        </p>
        <button
          type="button"
          onClick={() => void client.login()}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
        >
          client.login() (separate storage key)
        </button>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3 text-sm">
        <h2 className="font-medium">Querying Workspace settings & SSO Mode</h2>
        <p className="text-[var(--muted)]">
          You can use the SDK dynamically to check the workspace&apos;s name and active SSO mode (Open Auth vs. SSO Only). This lets you toggle UI, adjust direct sign-in links, or display custom branding.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 text-xs font-mono text-[var(--muted)]">
{`const { getWorkspaceConfig } = useAuth();

useEffect(() => {
  getWorkspaceConfig()
    .then((config) => {
      console.log("Workspace:", config.name);
      console.log("SSO Mode:", config.settings.loginMode); // "open" | "sso-only"
    });
}, []);`}
        </pre>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm">
        <h2 className="font-medium">Flow</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-4 text-xs text-[var(--muted)]">
{`Browser → SSSO /authorize (PKCE)
       ← redirect ?code
POST /api/auth/callback (code_verifier)
       ← access_token
GET /api/projects  Authorization: Bearer
       ← verifyAccessToken (@ssso/node)`}
        </pre>
      </section>

      <Link href="/projects" className="text-sm text-[var(--accent)] hover:underline">
        ← Back to Pulse
      </Link>
    </div>
  );
}
