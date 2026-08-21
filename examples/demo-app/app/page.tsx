"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@ssso/react";
import { getPublicEnv } from "@/lib/config";
import type { WorkspacePublicConfig } from "@ssso/core";

export default function HomePage() {
  const { isAuthenticated, login, loading, getWorkspaceConfig } = useAuth();
  const router = useRouter();
  const env = getPublicEnv();
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspacePublicConfig | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/projects");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;
    getWorkspaceConfig()
      .then((config) => {
        if (!cancelled) setWorkspaceConfig(config);
      })
      .catch((err) => {
        console.error("Failed to load workspace config:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [getWorkspaceConfig]);

  if (loading || isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Team workspace
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Ship work faster with single sign-on
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[var(--muted)]">
            Pulse is a sample SaaS app that shows how a real product wires{" "}
            <strong className="text-[var(--fg)]">OneAuth</strong>: browser login
            with PKCE, JWT sessions, and protected APIs verified on the server.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => login()}
              className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black hover:opacity-90"
            >
              Sign in with OneAuth
            </button>
            <Link
              href="/dev"
              className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm hover:border-zinc-500"
            >
              Integration details
            </Link>
          </div>
        </div>
        <div
          className="pointer-events-none absolute -right-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[var(--accent)]/10 blur-3xl"
          aria-hidden
        />
      </section>

      {workspaceConfig && (
        <section className="mx-auto max-w-6xl px-4 py-8 border-b border-[var(--border)]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center justify-between">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                OneAuth Workspace Connection
              </span>
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--fg)]">
                {workspaceConfig.name}
                {workspaceConfig.slug && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--border)] font-mono text-[var(--muted)] font-normal">
                    {workspaceConfig.slug}
                  </span>
                )}
              </h2>
              <p className="text-sm text-[var(--muted)] max-w-xl">
                This application is integrated with OneAuth. Below is the active authentication mode configured by the workspace administrator.
              </p>
            </div>

            <div className="flex flex-col gap-3 min-w-[280px]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                SSO / Auth Mode
              </span>
              {workspaceConfig.settings?.loginMode === "sso-only" ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold">
                    <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                    SSO Only Mode Enforced
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    Direct access to the OneAuth login dashboard is blocked. Users must sign in via a registered OAuth flow from this app.
                  </p>
                  <a
                    href={`${env.authUrl}/login`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs font-medium text-[var(--accent)] underline hover:text-[var(--accent-dim)]"
                  >
                    Test direct login block page ↗
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[var(--accent)] text-sm font-semibold">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    Open Auth Mode Enabled
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    Direct access to login and signup on the OneAuth tenant is open. Users can authenticate both here and directly.
                  </p>
                  <a
                    href={`${env.authUrl}/login`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs font-medium text-[var(--accent)] underline hover:text-[var(--accent-dim)]"
                  >
                    Visit direct login page ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-lg font-semibold">What you get after sign-in</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Projects & tasks",
              body: "CRUD against /api/projects with your access token — data scoped per user from the JWT.",
            },
            {
              title: "Server verification",
              body: "@ssso/node validates Bearer tokens on every API route, same pattern as Express middleware.",
            },
            {
              title: "Instant SSO",
              body: "Re-open authorize while logged into SSSO — no password prompt on return.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <h3 className="font-medium">{card.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-t border-[var(--border)] px-4 py-12">
        <h2 className="text-sm font-medium text-[var(--muted)]">Local setup</h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-[var(--muted)]">
          <li>
            SSSO on :3000 — register a <strong>public</strong> app at{" "}
            <a
              href={`${env.authUrl}/apps`}
              className="text-[var(--accent)] hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {env.authUrl}/apps
            </a>
          </li>
          <li>
            Redirect URL:{" "}
            <code className="text-[var(--fg)]">{env.redirectUri}</code>
          </li>
          <li>
            <code className="text-[var(--fg)]">npm run dev:demo</code> from repo
            root
          </li>
        </ol>
      </section>
    </div>
  );
}
