"use client";

import { useState } from "react";
import Link from "next/link";
import { getPublicConfig } from "@/lib/config";
import { resolveThemeSettings } from "@/lib/workspace/theme-resolver";

interface ForgotPasswordFormProps {
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

export function ForgotPasswordForm({ tenantWorkspace }: ForgotPasswordFormProps) {
  const { app } = getPublicConfig();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }

      setMessage(data.message);
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

        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Reset password</h1>
        <p className="auth-info-box mt-4 text-sm text-[var(--foreground)]/70 leading-relaxed p-4 bg-slate-50 border border-slate-100 rounded-lg">
          Enter your {tenantWorkspace ? tenantWorkspace.name : app.name} account email. We&apos;ll send a reset link if the account exists.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input w-full px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder-slate-400 border border-slate-200 rounded-lg outline-none"
            />
          </div>

          {error && (
            <div className="text-xs font-medium text-red-800 bg-red-50 border border-red-200 p-3 rounded-lg" role="alert">
              {error}
            </div>
          )}
          
          {message && (
            <div className="text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-200 p-3 rounded-lg" role="status">
              {message}
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
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors">
            ← Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
