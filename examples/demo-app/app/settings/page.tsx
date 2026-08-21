"use client";

import { ProtectedRoute, useAuth } from "@ssso/react";
import { decodeAccessToken } from "@ssso/core";
import { getPublicEnv } from "@/lib/config";
import { SignedOutPanel } from "@/components/SignedOutPanel";
import { useAppLogout } from "@/lib/use-app-logout";

export default function SettingsPage() {
  return (
    <ProtectedRoute
      fallback={<p className="text-[var(--muted)]">Loading…</p>}
      unauthenticated={<SignedOutPanel />}
    >
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { user, token, client } = useAuth();
  const signOut = useAppLogout();
  const env = getPublicEnv();
  const claims = token ? decodeAccessToken(token) : null;
  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/20 text-xl font-bold text-[var(--accent)]">
          {initial}
        </div>
        <div>
          <p className="font-medium">{user?.email}</p>
          <p className="mt-1 font-mono text-xs text-[var(--muted)]">
            User ID: {user?.id}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <h2 className="font-medium">Account</h2>
        <p className="text-sm text-[var(--muted)]">
          Profile and password are managed by your identity provider.
        </p>
        <a
          href={`${env.authUrl}/account`}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm text-[var(--accent)] hover:underline"
        >
          Open SSSO account →
        </a>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <h2 className="font-medium">This application</h2>
        <p className="text-sm text-[var(--muted)]">
          Signing out clears Pulse&apos;s access token only. Your SSSO SSO
          session may remain — use re-authorize to test silent SSO.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-zinc-500"
          >
            Sign out of Pulse
          </button>
          <button
            type="button"
            onClick={() => void client.login()}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-zinc-500"
          >
            Re-authorize (SSO test)
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-sm font-medium text-[var(--muted)]">
          Access token claims
        </h2>
        <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-black/30 p-3 text-xs">
          {claims ? JSON.stringify(claims, null, 2) : "—"}
        </pre>
      </section>
    </div>
  );
}
