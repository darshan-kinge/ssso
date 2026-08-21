"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EndUsersManager } from "@/components/workspace/EndUsersManager";
import { authFetch } from "@/lib/auth/api-client";

export default function WorkspaceUsersClient() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [role, setRole] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const stored = localStorage.getItem("ssso_active_workspace");
      const res = await authFetch("/api/workspaces");
      if (!res.ok) {
        setError("Sign in to view users.");
        return;
      }
      const data = await res.json();
      const list = data.workspaces as { id: string; name: string; role: string }[];
      const active = list.find((w) => w.id === stored) ?? list[0];
      if (!active) {
        setError("No workspace found. Create one from the dashboard.");
        return;
      }
      if (active.role !== "owner" && active.role !== "admin") {
        setError("You need admin or owner access to view end users.");
        return;
      }
      setWorkspaceId(active.id);
      setWorkspaceName(active.name);
      setRole(active.role);
    })();
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              End Users
            </h1>
            {workspaceName && (
              <p className="mt-1 text-sm font-medium text-slate-500">
                Workspace: <span className="font-semibold text-slate-950">{workspaceName}</span>
              </p>
            )}
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          Users who have registered on your tenant auth URL. Manage their access, verify status, and session history.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}{" "}
          <Link href="/login" className="underline font-semibold hover:text-red-900 transition">
            Sign in
          </Link>
        </div>
      ) : !workspaceId ? (
        <div className="flex gap-2 items-center text-sm font-medium text-slate-400 animate-pulse">
          <span className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
          Loading workspace…
        </div>
      ) : (
        <EndUsersManager workspaceId={workspaceId} myRole={role} />
      )}
    </main>
  );
}
