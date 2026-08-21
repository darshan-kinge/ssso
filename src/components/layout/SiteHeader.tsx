import Link from "next/link";
import { getPublicConfig } from "@/lib/config";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";

export function SiteHeader() {
  const { app, deployment } = getPublicConfig();
  const showWorkspace = deployment.workspaceCollaboration;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
        {/* Wordmark */}
        <Link
          href={deployment.saas ? "/dashboard" : "/"}
          className="text-sm font-extrabold tracking-tight text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          {app.name}
        </Link>

        {/* Nav */}
        <nav className="flex flex-wrap items-center justify-end gap-1 text-xs">
          {showWorkspace && <WorkspaceSwitcher />}

          {deployment.saas ? (
            <Link
              href="/dashboard"
              className="px-3 py-1.5 font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded transition"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/apps"
              className="px-3 py-1.5 font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded transition"
            >
              Apps
            </Link>
          )}

          {showWorkspace && (
            <Link
              href="/dashboard/workspace/users"
              className="px-3 py-1.5 font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded transition"
            >
              Users
            </Link>
          )}

          {showWorkspace && (
            <Link
              href="/dashboard/workspace/members"
              className="px-3 py-1.5 font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded transition"
            >
              Team
            </Link>
          )}

          <Link
            href="/account"
            className="ml-2 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Account
          </Link>
        </nav>
      </div>
    </header>
  );
}
