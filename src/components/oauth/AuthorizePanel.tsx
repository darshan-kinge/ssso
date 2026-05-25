"use client";

import { useState } from "react";
import Link from "next/link";
import type { AuthorizeParams } from "@/lib/oauth/params";
import { buildAuthorizeQuery } from "@/lib/oauth/params";

interface AuthorizePanelProps {
  brandName: string;
  appName: string;
  params: AuthorizeParams;
}

export function AuthorizePanel({ brandName, appName, params }: AuthorizePanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const authorizeQuery = buildAuthorizeQuery(params);
  const loginHref = `/login?${authorizeQuery}`;

  async function handleContinue() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/oauth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "login_required") {
          window.location.href = loginHref;
          return;
        }
        setError(data.error ?? "Authorization failed");
        return;
      }

      window.location.href = data.redirectUrl;
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <p className="text-sm text-[var(--muted)]">{brandName} SSO</p>
      <h2 className="mt-2 text-xl font-semibold">
        Sign in to <span className="text-[var(--accent)]">{appName}</span>
      </h2>
      <p className="mt-3 text-sm text-[var(--muted)]">
        <strong>{appName}</strong> will receive a secure access token. You will
        be redirected back after approving.
      </p>
      <p className="mt-2 break-all font-mono text-xs text-[var(--muted)]">
        {params.redirect_uri}
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Redirecting…" : `Continue to ${appName}`}
      </button>

      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        <Link href={loginHref} className="text-[var(--accent)] hover:underline">
          Sign in with another account
        </Link>
      </p>
    </div>
  );
}
