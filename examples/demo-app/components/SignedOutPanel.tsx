"use client";

import Link from "next/link";
import { useAuth } from "@ssso/react";

export function SignedOutPanel() {
  const { login } = useAuth();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <p className="text-[var(--muted)]">Sign in to access Pulse.</p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-zinc-600"
        >
          Back to home
        </Link>
        <button
          type="button"
          onClick={() => login()}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Sign in again
        </button>
      </div>
    </div>
  );
}
