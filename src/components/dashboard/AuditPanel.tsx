"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/api-client";

interface AuditEvent {
  id: string;
  action: string;
  plane?: string;
  workspaceId?: string | null;
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
    return <p className="text-sm font-medium text-slate-400 animate-pulse">Loading activity…</p>;
  }

  if (events.length === 0) {
    return (
      <p className="text-xs font-semibold text-slate-400">
        No security events recorded yet.
      </p>
    );
  }

  return (
    <ul className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
      {events.map((e) => (
        <li
          key={e.id}
          className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0 text-xs"
        >
          <div>
            <p className="font-mono font-semibold text-slate-900">{e.action}</p>
            <p className="mt-1 text-[10px] text-slate-400 font-medium leading-normal">
              {e.createdAt
                ? new Date(e.createdAt).toLocaleString()
                : "—"}{" "}
              · {e.ip}
              {e.plane && (
                <>
                  {" "}
                  · {e.plane} plane
                </>
              )}
            </p>
          </div>
          <span
            className={
              e.success 
                ? "text-[9px] font-semibold tracking-wider uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full" 
                : "text-[9px] font-semibold tracking-wider uppercase text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"
            }
          >
            {e.success ? "success" : "failed"}
          </span>
        </li>
      ))}
    </ul>
  );
}
