"use client";

import Link from "next/link";
import { useAuth } from "@oneauth/react";
import { getPublicEnv } from "@/lib/config";

export default function HomePage() {
  const { isAuthenticated, login, loading } = useAuth();
  const env = getPublicEnv();

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
          OneAuth SDK demo
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          A complete consumer application
        </h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          This app runs on port <strong>3001</strong> and authenticates against
          your OneAuth server. It demonstrates{" "}
          <code className="text-[var(--fg)]">@oneauth/react</code>,{" "}
          <code className="text-[var(--fg)]">@oneauth/core</code>, and{" "}
          <code className="text-[var(--fg)]">@oneauth/node</code> working
          together.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            pkg: "@oneauth/react",
            desc: "AuthProvider, useAuth, ProtectedRoute, OAuth callback",
          },
          {
            pkg: "@oneauth/core",
            desc: "OneAuthClient, login(), token storage, JWT decode",
          },
          {
            pkg: "@oneauth/node",
            desc: "verifyAccessToken on /api/protected/* routes",
          },
        ].map((item) => (
          <div
            key={item.pkg}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <p className="font-mono text-sm text-[var(--accent)]">{item.pkg}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{item.desc}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-semibold">Quick start</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-[var(--muted)]">
          <li>
            Run OneAuth on port 3000:{" "}
            <code className="text-[var(--fg)]">npm run dev</code> (repo root)
          </li>
          <li>
            Register app at{" "}
            <a
              href={`${env.authUrl}/apps`}
              className="text-[var(--accent)] hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {env.authUrl}/apps
            </a>{" "}
            with redirect{" "}
            <code className="text-[var(--fg)]">{env.redirectUri}</code>
          </li>
          <li>
            Copy <code className="text-[var(--fg)]">.env.example</code> →{" "}
            <code className="text-[var(--fg)]">.env.local</code> in this folder
          </li>
          <li>
            Run demo: <code className="text-[var(--fg)]">npm run dev:demo</code>{" "}
            from repo root
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          {!loading && !isAuthenticated && (
            <button
              type="button"
              onClick={() => login()}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black"
            >
              Sign in with OneAuth
            </button>
          )}
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black"
            >
              Open dashboard →
            </Link>
          )}
          <Link
            href="/api-demo"
            className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm hover:border-zinc-600"
          >
            API demo
          </Link>
        </div>
      </section>
    </div>
  );
}
