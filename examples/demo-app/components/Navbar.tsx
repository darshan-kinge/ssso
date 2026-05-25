"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@oneauth/react";
import { useAppLogout } from "@/lib/use-app-logout";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/api-demo", label: "API demo" },
  { href: "/core-demo", label: "Core SDK" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, login, loading } = useAuth();
  const signOut = useAppLogout();

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-[var(--accent)]">
            Demo App
          </Link>
          <nav className="hidden gap-4 text-sm sm:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  pathname === l.href
                    ? "text-[var(--fg)]"
                    : "text-[var(--muted)] hover:text-[var(--fg)]"
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {loading ? (
            <span className="text-[var(--muted)]">…</span>
          ) : isAuthenticated ? (
            <>
              <span className="hidden max-w-[140px] truncate text-[var(--muted)] sm:inline">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 hover:border-zinc-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => login()}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 font-medium text-black hover:bg-[var(--accent-dim)]"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
