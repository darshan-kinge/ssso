"use client";

import { ProtectedRoute, useAuth } from "@oneauth/react";
import { decodeAccessToken } from "@oneauth/core";
import Link from "next/link";
import { SignedOutPanel } from "@/components/SignedOutPanel";
import { useAppLogout } from "@/lib/use-app-logout";

export default function DashboardPage() {
  return (
    <ProtectedRoute
      fallback={
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--muted)]">Checking session…</p>
        </div>
      }
      unauthenticated={<SignedOutPanel />}
    >
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, token, client } = useAuth();
  const signOut = useAppLogout();
  const claims = token ? decodeAccessToken(token) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Protected with <code>@oneauth/react</code> ProtectedRoute
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-medium text-[var(--muted)]">User (SDK)</h2>
          <p className="mt-2 text-lg">{user?.email}</p>
          <p className="mt-1 font-mono text-xs text-[var(--muted)]">
            id: {user?.id}
          </p>
          {user?.clientId && (
            <p className="mt-1 font-mono text-xs text-[var(--muted)]">
              client: {user.clientId}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-medium text-[var(--muted)]">
            JWT claims (@oneauth/core decode)
          </h2>
          <pre className="mt-2 max-h-40 overflow-auto text-xs text-[var(--muted)]">
            {claims
              ? JSON.stringify(claims, null, 2)
              : "No token"}
          </pre>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-medium">Session actions</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Sign out clears this app&apos;s access token and returns you home.
          Your OneAuth SSO cookie may still exist — use Re-authorize to test
          instant SSO.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-zinc-600"
          >
            Sign out (this app)
          </button>
          <button
            type="button"
            onClick={() => client.login()}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-zinc-600"
          >
            Re-authorize (SSO test)
          </button>
          <Link
            href="/api-demo"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
          >
            Test protected API →
          </Link>
        </div>
      </div>
    </div>
  );
}
