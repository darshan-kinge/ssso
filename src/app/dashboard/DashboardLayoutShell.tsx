"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/auth/api-client";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";

interface NavItem {
  name: string;
  tab: string;
  icon: (active: boolean) => React.ReactNode;
}

// Only tabs that are fully implemented
const NAV_ITEMS: NavItem[] = [
  {
    name: "Overview",
    tab: "overview",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-indigo-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    ),
  },
  {
    name: "Applications",
    tab: "apps",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-indigo-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    name: "Users",
    tab: "users",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-indigo-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: "Members",
    tab: "members",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-indigo-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: "Sessions",
    tab: "sessions",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-indigo-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Audit Logs",
    tab: "audit-logs",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-indigo-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: "Settings",
    tab: "settings",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-indigo-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function DashboardLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    authFetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.email) setUserEmail(data.user.email);
      })
      .catch(() => {});
  }, []);

  const isTabActive = (tab: string) =>
    pathname === "/dashboard" && activeTab === tab;

  const SidebarContent = () => (
    <>
      {/* Logo / Brand */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
          S
        </span>
        <span className="font-bold text-sm tracking-tight text-slate-800">SSSO</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isTabActive(item.tab);
          return (
            <Link
              key={item.tab}
              href={`/dashboard?tab=${item.tab}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.icon(active)}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Profile footer */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-[11px] text-indigo-600 shrink-0">
          {userEmail ? userEmail.slice(0, 2).toUpperCase() : "—"}
        </div>
        <p className="text-xs font-medium text-slate-600 truncate min-w-0 leading-none">
          {userEmail || "Loading..."}
        </p>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar — Desktop */}
      <aside className="w-56 shrink-0 hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-slate-200">
        <SidebarContent />
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <aside className="fixed top-0 left-0 z-50 w-56 h-screen bg-white border-r border-slate-200 flex flex-col md:hidden">
          <SidebarContent />
        </aside>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-12 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
              aria-label="Open menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Current section title */}
            <span className="text-sm font-semibold text-slate-700">
              {NAV_ITEMS.find((n) => n.tab === activeTab)?.name ?? "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <WorkspaceSwitcher />
            <Link
              href="/dashboard/workspace/new"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Workspace
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
