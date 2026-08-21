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
    return <p className="text-sm text-slate-400 animate-pulse">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-xl text-sm flex items-center justify-between">
        <span>{error ?? "Not signed in."}</span>
        <Link
          href="/login"
          className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Details */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Signed in as</span>
        <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 leading-none">{user.email}</p>
        <dl className="mt-6 space-y-3 text-xs border-t border-slate-100 pt-4">
          <div className="flex justify-between items-center gap-4">
            <dt className="text-slate-500 font-medium">User ID</dt>
            <dd className="truncate font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded select-all">{user.id}</dd>
          </div>
          <div className="flex justify-between items-center gap-4">
            <dt className="text-slate-500 font-medium">Email Verified</dt>
            <dd className="font-semibold uppercase text-[10px]">
              {user.isVerified ? (
                <span className="text-emerald-750 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Yes</span>
              ) : (
                <span className="text-red-750 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">No</span>
              )}
            </dd>
          </div>
        </dl>
        
        {!user.isVerified && (
          <div className="mt-5 border border-red-200 border-dashed bg-red-50/50 p-4 rounded-xl text-xs space-y-2">
            <p className="font-semibold text-red-800">Email not verified.</p>
            <button
              type="button"
              onClick={resendVerification}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-colors"
            >
              Resend verification email
            </button>
            {verifyMsg && (
              <p className="text-[10px] font-medium text-slate-500">{verifyMsg}</p>
            )}
          </div>
        )}
        
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 w-full inline-flex items-center justify-center rounded-lg bg-red-650 px-4 py-2.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
        >
          Sign out (this device)
        </button>
      </div>

      {/* Active Sessions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <SessionsPanel />
      </div>

      {/* Security Activity */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">Security Activity</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Recent events for your active workspace (sign-ins, invites, sessions).
        </p>
        <div className="mt-4">
          <AuditPanel />
        </div>
      </div>
    </div>
  );
}
