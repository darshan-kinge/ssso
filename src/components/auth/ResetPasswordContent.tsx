"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getPublicConfig } from "@/lib/config";
import { resolveThemeSettings } from "@/lib/workspace/theme-resolver";

interface ResetPasswordContentProps {
  tenantWorkspace?: {
    name: string;
    settings?: {
      logoUrl?: string | null;
      primaryColor?: string | null;
      themeType?: string | null;
      backgroundImageUrl?: string | null;
      backgroundColor?: string | null;
      customCardBg?: string | null;
      customCardBorder?: string | null;
      customCardText?: string | null;
      customButtonBg?: string | null;
      customButtonText?: string | null;
    } | null;
  } | null;
}

export function ResetPasswordContent({ tenantWorkspace }: ResetPasswordContentProps) {
  const { app } = getPublicConfig();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Missing reset token. Use the link from your email.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Reset failed");
        return;
      }

      router.push("/login?reset=success");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const theme = resolveThemeSettings(tenantWorkspace?.settings);

  return (
    <div 
      className={`flex min-h-screen flex-col items-center justify-center p-6 ${theme.themeClass}`}
      style={theme.outerStyle}
    >
      <main className={theme.cardClass}>
        {tenantWorkspace?.settings?.logoUrl ? (
          <div className="mb-6 flex justify-center">
            <img
              src={tenantWorkspace.settings.logoUrl}
              alt={`${tenantWorkspace.name} logo`}
              className="auth-logo-img max-h-16 max-w-full object-contain p-2"
            />
          </div>
        ) : null}

        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Choose new password</h1>
        <p className="auth-info-box mt-4 text-sm text-[var(--foreground)]/70 leading-relaxed p-4 bg-slate-50 border border-slate-100 rounded-lg">
          For your {tenantWorkspace ? tenantWorkspace.name : app.name} account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input w-full px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder-slate-400 border border-slate-200 rounded-lg outline-none"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="auth-input w-full px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder-slate-400 border border-slate-200 rounded-lg outline-none"
            />
          </div>

          {error && (
            <div className="text-xs font-medium text-red-800 bg-red-50 border border-red-200 p-3 rounded-lg" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "var(--tenant-primary, var(--accent))",
            }}
            className="auth-button w-full py-3 text-sm font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors">
            ← Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
