import Link from "next/link";
import { getPublicConfig } from "@/lib/config";
import { AccountPanel } from "@/components/auth/AccountPanel";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function AccountPage() {
  const { app, deployment } = getPublicConfig();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-xl px-6 py-10">
        <div className="mb-8 pb-6 border-b border-slate-200">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{app.name} Account</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Manage your profile, active sessions, and security events.
          </p>
        </div>
        <AccountPanel />
        <div className="mt-10 flex gap-3 text-xs">
          <Link
            href={deployment.saas ? "/dashboard" : "/apps"}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            {deployment.saas ? "Dashboard" : "Manage apps"}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Home
          </Link>
        </div>
      </main>
    </>
  );
}
