"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth/api-client";

interface EndUser {
  id: string;
  email: string;
  isVerified: boolean;
  disabled: boolean;
  externalId: string | null;
  createdAt: string | null;
  lastSeenAt: string | null;
}

interface EndUsersManagerProps {
  workspaceId: string;
  myRole: string | undefined;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmt(iso);
}

export function EndUsersManager({ workspaceId, myRole }: EndUsersManagerProps) {
  const canManage = myRole === "owner" || myRole === "admin";

  const [users, setUsers] = useState<EndUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EndUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<EndUser | null>(null);

  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search ? { search } : {}),
      });
      const res = await authFetch(
        `/api/workspaces/${workspaceId}/users?${params}`
      );
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to load users");
        return;
      }
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function handleToggleDisable(user: EndUser) {
    setActionLoading(true);
    try {
      const res = await authFetch(
        `/api/workspaces/${workspaceId}/users/${user.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disabled: !user.disabled }),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Action failed");
        return;
      }
      await load();
      if (selected?.id === user.id) {
        setSelected((prev) =>
          prev ? { ...prev, disabled: !user.disabled } : null
        );
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(user: EndUser) {
    setActionLoading(true);
    try {
      const res = await authFetch(
        `/api/workspaces/${workspaceId}/users/${user.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Delete failed");
        return;
      }
      setConfirmDelete(null);
      setSelected(null);
      await load();
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all w-64"
          />
          {loading && (
            <span className="text-xs font-medium text-slate-400 animate-pulse">Loading…</span>
          )}
        </div>
        <span className="text-xs font-medium text-slate-400">
          {total} user{total !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-3xl text-slate-200 mb-3">◎</p>
          <p className="text-sm font-medium text-slate-500">
            {search ? "No users match your search." : "No end users have signed up yet."}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Users appear here when they register via the tenant auth URL.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hidden sm:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">Last seen</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50 transition-colors ${u.disabled ? "opacity-50" : ""}`}
                  >
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900 text-xs">{u.email}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.disabled ? (
                          <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold rounded-full">
                            Disabled
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                              u.isVerified
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                          >
                            {u.isVerified ? "Verified" : "Unverified"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-400 hidden sm:table-cell">
                      {fmt(u.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-400 hidden md:table-cell">
                      {relativeTime(u.lastSeenAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelected(u)}
                        className="inline-flex items-center px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            ← Prev
          </button>
          <span className="text-xs font-medium text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Next →
          </button>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  End User
                </span>
                <p className="mt-1 text-sm font-semibold text-slate-900 truncate max-w-[260px]">
                  {selected.email}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-sm"
              >
                ✕
              </button>
            </div>

            {/* Detail rows */}
            <div className="px-5 py-4 space-y-3">
              {[
                { label: "ID", value: selected.id, mono: true },
                { label: "Email", value: selected.email },
                { label: "Verified", value: selected.isVerified ? "Yes" : "No" },
                { label: "Disabled", value: selected.disabled ? "Yes" : "No" },
                { label: "External ID", value: selected.externalId ?? "—" },
                { label: "Joined", value: fmt(selected.createdAt) },
                { label: "Last seen", value: relativeTime(selected.lastSeenAt) },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 shrink-0 mt-0.5">{row.label}</span>
                  <span className={`text-xs font-medium text-slate-700 text-right ${row.mono ? "font-mono text-[10px] break-all" : ""}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            {canManage && (
              <div className="border-t border-slate-100 px-5 py-4 flex gap-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleToggleDisable(selected)}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  {selected.disabled ? "Enable user" : "Disable user"}
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => setConfirmDelete(selected)}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-semibold text-slate-900">Confirm delete</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Permanently delete <strong className="text-slate-700">{confirmDelete.email}</strong>? This also revokes all their sessions and cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                disabled={actionLoading}
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {actionLoading ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
