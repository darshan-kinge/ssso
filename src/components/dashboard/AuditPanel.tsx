"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/api-client";

interface AuditEvent {
  id: string;
  action: string;
  success: boolean;
  ip: string;
  createdAt?: string;
}

export function AuditPanel() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await authFetch("/api/audit");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setEvents(data.events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading activity…</p>;
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No security events recorded yet.
      </p>
    );
  }

  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto">
      {events.map((e) => (
        <li
          key={e.id}
          className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs"
        >
          <div>
            <p className="font-mono text-[var(--foreground)]">{e.action}</p>
            <p className="mt-0.5 text-[var(--muted)]">
              {e.createdAt
                ? new Date(e.createdAt).toLocaleString()
                : "—"}{" "}
              · {e.ip}
            </p>
          </div>
          <span
            className={
              e.success ? "text-[var(--accent)]" : "text-red-400"
            }
          >
            {e.success ? "ok" : "fail"}
          </span>
        </li>
      ))}
    </ul>
  );
}
