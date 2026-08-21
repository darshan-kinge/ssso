"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth/api-client";

interface Member {
  membershipId: string;
  userId: string;
  email: string;
  role: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

interface MembersManagerProps {
  workspaceId: string;
  myRole?: string;
}

export function MembersManager({ workspaceId, myRole }: MembersManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "developer" | "viewer">("developer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canAdmin = myRole === "owner" || myRole === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await authFetch(`/api/workspaces/${workspaceId}/members`);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to load members");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setMembers(data.members ?? []);
    setInvites(data.invites ?? []);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdmin) return;
    setError(null);
    const res = await authFetch(`/api/workspaces/${workspaceId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Invite failed");
      return;
    }
    setEmail("");
    void load();
  }

  async function revokeInvite(id: string) {
    if (!confirm("Revoke this invite?")) return;
    const res = await authFetch(
      `/api/workspaces/${workspaceId}/invites/${id}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Revoke failed");
      return;
    }
    void load();
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this member?")) return;
    const res = await authFetch(
      `/api/workspaces/${workspaceId}/members/${userId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Remove failed");
      return;
    }
    void load();
  }

  async function changeRole(userId: string, newRole: string) {
    const res = await authFetch(
      `/api/workspaces/${workspaceId}/members/${userId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      }
    );
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Update failed");
      return;
    }
    void load();
  }

  if (loading) {
    return (
      <p className="text-sm font-medium text-slate-400 animate-pulse py-4">
        Loading team…
      </p>
    );
  }

  const roleBadgeColor = (r: string) => {
    if (r === "owner") return "bg-indigo-50 text-indigo-700 border-indigo-100";
    if (r === "admin") return "bg-amber-50 text-amber-700 border-amber-100";
    if (r === "developer") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    return "bg-slate-50 text-slate-600 border-slate-100";
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {canAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Invite a team member</h2>
          <form onSubmit={sendInvite} className="flex flex-wrap gap-3">
            <input
              type="email"
              required
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "admin" | "developer" | "viewer")
              }
              className="rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 px-3.5 py-2 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Send invite
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-400">
            Invites expire in 72 hours. Email must match their sign-in address.
          </p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Members ({members.length})
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {members.map((m) => (
              <li
                key={m.userId}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm"
              >
                <span className="font-medium text-slate-900">{m.email}</span>
                <div className="flex items-center gap-3">
                  {canAdmin && m.role !== "owner" ? (
                    <select
                      value={m.role}
                      onChange={(e) => void changeRole(m.userId, e.target.value)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="admin">admin</option>
                      <option value="developer">developer</option>
                      <option value="viewer">viewer</option>
                    </select>
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${roleBadgeColor(m.role)}`}>
                      {m.role}
                    </span>
                  )}
                  {canAdmin && m.role !== "owner" && (
                    <button
                      type="button"
                      onClick={() => void removeMember(m.userId)}
                      className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {invites.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Pending Invites
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {invites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 px-5 py-4 text-sm"
                >
                  <span className="font-medium text-slate-900">
                    {inv.email}
                    <span className="ml-2 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                      {inv.role}
                    </span>
                  </span>
                  {canAdmin && (
                    <button
                      type="button"
                      onClick={() => void revokeInvite(inv.id)}
                      className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
