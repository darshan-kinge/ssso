"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MembersManager } from "@/components/workspace/MembersManager";
import { authFetch } from "@/lib/auth/api-client";

export default function WorkspaceMembersClient() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [role, setRole] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const stored = localStorage.getItem("ssso_active_workspace");
      const res = await authFetch("/api/workspaces");
      if (!res.ok) {
        setError("Sign in to manage team members.");
        return;
      }
      const data = await res.json();
      const list = data.workspaces as { id: string; role: string }[];
      const active =
        list.find((w) => w.id === stored) ?? list[0];
      if (!active) {
        setError("No workspace found. Create one from the dashboard.");
        return;
      }
      setWorkspaceId(active.id);
      setRole(active.role);
    })();
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <div className="mb-8 pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team members</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Invite admins, developers, or viewers to your workspace.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <Link href="/login" className="text-indigo-650 font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      )}

      {workspaceId && (
        <div className="mt-8">
          <MembersManager workspaceId={workspaceId} myRole={role} />
        </div>
      )}
    </main>
  );
}
