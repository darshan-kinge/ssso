"use client";

import { useAuth } from "@oneauth/react";
import Link from "next/link";

/**
 * OAuth redirect_uri target. AuthProvider exchanges the code via
 * POST /api/auth/callback then redirects to dashboard.
 */
export default function CallbackPage() {
  const { loading, error, isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <h1 className="text-xl font-semibold">OAuth callback</h1>
      {loading && (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Exchanging authorization code…
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {!loading && isAuthenticated && (
        <p className="mt-4 text-sm text-[var(--accent)]">
          Success — redirecting…
        </p>
      )}
      {!loading && !isAuthenticated && !error && (
        <>
          <p className="mt-4 text-sm text-[var(--muted)]">
            No code in URL or exchange pending.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-[var(--accent)]">
            ← Home
          </Link>
        </>
      )}
    </div>
  );
}
