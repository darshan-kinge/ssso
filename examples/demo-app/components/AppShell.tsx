"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@ssso/react";
import { useAppLogout } from "@/lib/use-app-logout";

const appLinks = [
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, login, loading } = useAuth();
  const signOut = useAppLogout();

  const isApp =
    pathname.startsWith("/projects") || pathname.startsWith("/settings");
  const isMarketing = pathname === "/";
  const isDev = pathname.startsWith("/dev");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-black">
                P
              </span>
              <span>Pulse</span>
            </Link>
            {(isApp || isDev) && isAuthenticated && (
              <nav className="hidden gap-1 sm:flex">
                {appLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={
                      pathname === l.href || pathname.startsWith(l.href + "/")
                        ? "rounded-lg bg-[var(--border)] px-3 py-1.5 text-sm text-[var(--fg)]"
                        : "rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
                    }
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm">
            {loading ? (
              <span className="text-[var(--muted)]">…</span>
            ) : isAuthenticated ? (
              <>
                <span className="hidden max-w-[180px] truncate text-[var(--muted)] sm:inline">
                  {user?.email}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 hover:border-zinc-500"
                >
                  Sign out
                </button>
              </>
            ) : (
              !isMarketing && (
                <button
                  type="button"
                  onClick={() => login()}
                  className="rounded-lg bg-[var(--accent)] px-3 py-1.5 font-medium text-black"
                >
                  Sign in
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <main
        className={
          isMarketing
            ? "flex-1"
            : "mx-auto w-full max-w-6xl flex-1 px-4 py-8"
        }
      >
        {children}
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        Pulse demo · SSO via{" "}
        <Link href="/dev" className="text-[var(--accent)] hover:underline">
          OneAuth
        </Link>
      </footer>
    </div>
  );
}
