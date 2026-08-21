"use client";

import { useState } from "react";
import Link from "next/link";
import type { AuthorizeParams } from "@/lib/oauth/params";
import { buildAuthorizeQuery } from "@/lib/oauth/params";

interface AuthorizePanelProps {
  brandName: string;
  workspaceName?: string;
  workspaceSettings?: {
    logoUrl?: string | null;
    primaryColor?: string | null;
  } | null;
  appName: string;
  params: AuthorizeParams;
}

export function AuthorizePanel({
  brandName,
  workspaceName,
  workspaceSettings,
  appName,
  params,
}: AuthorizePanelProps) {
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
          window.location.assign(loginHref);
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
    <div className="space-y-4">
      {workspaceSettings?.logoUrl ? (
        <div className="mb-6 flex justify-center">
          <img
            src={workspaceSettings.logoUrl}
            alt={`${workspaceName || brandName} logo`}
            className="auth-logo-img max-h-16 max-w-full object-contain p-2"
          />
        </div>
      ) : null}

      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {workspaceName ? `${workspaceName} • ` : ""}
        {brandName}
      </p>
      
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        Sign in to <span className="underline decoration-indigo-500 decoration-2">{appName}</span>
      </h2>
      
      <p className="auth-info-box text-sm text-slate-600 leading-relaxed p-4 bg-slate-50 border border-slate-100 rounded-lg">
        <strong>{appName}</strong> will receive a secure access token. You will
        be redirected back after approving.
      </p>



      {error && (
        <div className="text-xs font-medium text-red-800 bg-red-50 border border-red-200 p-3 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading}
        style={{
          backgroundColor: workspaceSettings?.primaryColor || "var(--tenant-primary, #4f46e5)",
        }}
        className="auth-button w-full py-3 text-sm font-semibold rounded-lg text-white shadow-sm hover:brightness-95 active:scale-98 transition-all disabled:opacity-50"
      >
        {loading ? "Redirecting…" : `Continue to ${appName}`}
      </button>

      <p className="text-center text-sm text-slate-500">
        <Link href={loginHref} className="text-indigo-600 font-semibold hover:text-indigo-500 transition-colors">
          Sign in with another account
        </Link>
      </p>
    </div>
  );
}
