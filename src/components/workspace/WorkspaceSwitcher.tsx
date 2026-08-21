"use client";

import Link from "next/link";
import { getPublicConfig } from "@/lib/config";
import { useWorkspace } from "./useWorkspace";

export function WorkspaceSwitcher() {
  const { deployment } = getPublicConfig();
  const { workspaces, active, loading, activate } = useWorkspace();

  if (loading) {
    return (
      <span className="text-xs text-slate-400 animate-pulse">Loading…</span>
    );
  }

  if (workspaces.length === 0) {
    if (deployment.saas) {
      return (
        <Link
          href="/dashboard/workspace/new"
          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
        >
          Create Workspace
        </Link>
      );
    }
    return null;
  }

  if (workspaces.length === 1) {
    return (
      <span className="max-w-[140px] truncate text-xs font-semibold text-slate-700 bg-slate-100 rounded-md px-2.5 py-1 hidden sm:inline-block">
        {workspaces[0].name}
      </span>
    );
  }

  return (
    <select
      value={active?.id ?? workspaces[0]?.id ?? ""}
      onChange={(e) => void activate(e.target.value)}
      className="max-w-[180px] rounded-lg border border-slate-200 bg-white text-slate-700 px-2.5 py-1.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
      aria-label="Active workspace"
    >
      {workspaces.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  );
}
