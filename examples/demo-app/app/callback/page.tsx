"use client";

import { useAuth } from "@ssso/react";

export default function CallbackPage() {
  const { loading, error, isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <h1 className="text-xl font-semibold">Signing you in</h1>
      {loading && (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Completing sign-in with SSSO…
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {!loading && isAuthenticated && (
        <p className="mt-4 text-sm text-[var(--accent)]">
          Success — opening Pulse…
        </p>
      )}
    </div>
  );
}
