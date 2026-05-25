"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth/api-client";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
} from "@/lib/auth/client";
import { SessionsPanel } from "@/components/dashboard/SessionsPanel";
import { AuditPanel } from "@/components/dashboard/AuditPanel";

interface PublicUser {
  id: string;
  email: string;
  isVerified: boolean;
  createdAt?: string;
}

export function AccountPanel() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    const res = await authFetch("/api/auth/me");

    if (res.status === 401) {
      clearStoredAccessToken();
      setUser(null);
      setError("Session expired. Please sign in again.");
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to load account");
      return;
    }

    const data = await res.json();
    setUser(data.user);
    setError(null);
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      setLoading(false);
      setError("Not signed in.");
      return;
    }

    fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  async function resendVerification() {
    if (!user?.email) return;
    setVerifyMsg(null);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });
    const data = await res.json();
    setVerifyMsg(data.message ?? "Sent if applicable.");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    clearStoredAccessToken();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }

  if (!user) {
    return (
      <div>
        <p className="text-sm text-red-400">{error ?? "Not signed in."}</p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-sm text-[var(--muted)]">Signed in as</p>
        <p className="mt-1 text-lg font-medium">{user.email}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">User ID</dt>
            <dd className="truncate font-mono text-xs">{user.id}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Verified</dt>
            <dd>{user.isVerified ? "Yes" : "No"}</dd>
          </div>
        </dl>
        {!user.isVerified && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <p className="text-amber-100">Email not verified.</p>
            <button
              type="button"
              onClick={resendVerification}
              className="mt-2 text-[var(--accent)] hover:underline"
            >
              Resend verification email
            </button>
            {verifyMsg && (
              <p className="mt-2 text-xs text-[var(--muted)]">{verifyMsg}</p>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 w-full rounded-lg border border-[var(--border)] py-2.5 text-sm font-medium transition hover:border-zinc-600"
        >
          Sign out (this device)
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <SessionsPanel />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-medium">Security activity</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Recent sign-ins and account events (Phase 6 audit log).
        </p>
        <div className="mt-4">
          <AuditPanel />
        </div>
      </div>
    </div>
  );
}
