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
    return <p className="text-sm text-[var(--muted)]">Loading devices…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Active sessions</h2>
        <span className="text-xs text-[var(--muted)]">{sessions.length} device(s)</span>
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {sessions.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No active sessions.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {s.device}
                  {s.isCurrent && (
                    <span className="ml-2 rounded bg-[var(--accent)]/20 px-1.5 py-0.5 text-xs text-[var(--accent)]">
                      This device
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Expires {new Date(s.expiresAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === s.id}
                onClick={() => revokeSession(s.id)}
                className="shrink-0 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                {busyId === s.id ? "…" : "Revoke"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={busyId !== null || sessions.length <= 1}
          onClick={revokeOthers}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-zinc-600 disabled:opacity-50"
        >
          {busyId === "others" ? "Revoking…" : "Sign out other devices"}
        </button>
        <button
          type="button"
          disabled={busyId !== null}
          onClick={revokeEverywhere}
          className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          Sign out everywhere
        </button>
      </div>
    </div>
  );
}
