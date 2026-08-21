"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth/api-client";
import { clearStoredAccessToken } from "@/lib/auth/client";

interface SessionRecord {
  id: string;
  device: string;
  createdAt?: string;
  expiresAt: string;
  isCurrent: boolean;
}

export function SessionsPanel() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await authFetch("/api/sessions");
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to load sessions");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setSessions(data.sessions);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function revokeSession(id: string) {
    setBusyId(id);
    const res = await authFetch(`/api/sessions/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to revoke");
      setBusyId(null);
      return;
    }

    if (data.revokedCurrent) {
      clearStoredAccessToken();
      router.push("/login");
      return;
    }

    await load();
    setBusyId(null);
  }

  async function revokeOthers() {
    setBusyId("others");
    const res = await authFetch("/api/sessions/revoke-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exceptCurrent: true }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to revoke sessions");
      setBusyId(null);
      return;
    }

    await load();
    setBusyId(null);
  }

  async function revokeEverywhere() {
    if (!confirm("Sign out on all devices including this one?")) return;

    setBusyId("all");
    await authFetch("/api/sessions/revoke-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exceptCurrent: false }),
    });
    clearStoredAccessToken();
    router.push("/login");
  }

  if (loading) {
    return <p className="text-sm font-medium text-slate-400 animate-pulse">Loading devices…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-500">Active Sessions</h3>
        <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded text-xs font-semibold">
          {sessions.length} device(s)
        </span>
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-600" role="alert">
          {error}
        </p>
      )}

      {sessions.length === 0 ? (
        <p className="text-xs font-semibold text-slate-400">No active sessions.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-xs text-slate-900 flex items-center gap-2">
                  {s.device}
                  {s.isCurrent && (
                    <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[9px] font-semibold border border-indigo-100 rounded">
                      This device
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[10px] font-medium text-slate-400 font-mono">
                  Expires {new Date(s.expiresAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === s.id}
                onClick={() => revokeSession(s.id)}
                className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-500 hover:underline disabled:opacity-50 transition-colors"
              >
                {busyId === s.id ? "…" : "Revoke"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 sm:flex-row pt-2">
        <button
          type="button"
          disabled={busyId !== null || sessions.length <= 1}
          onClick={revokeOthers}
          className="flex-grow inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {busyId === "others" ? "Revoking…" : "Sign out other devices"}
        </button>
        <button
          type="button"
          disabled={busyId !== null}
          onClick={revokeEverywhere}
          className="flex-grow inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          Sign out everywhere
        </button>
      </div>
    </div>
  );
}
