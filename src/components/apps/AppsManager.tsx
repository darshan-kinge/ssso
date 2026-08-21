"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppCard } from "@/components/dashboard/AppCard";
import { useAppsQuery, useCreateAppMutation } from "@/hooks/useApps";

interface AppsManagerProps {
  /** Tenant host for OAuth authorize samples (SaaS). Falls back to window origin. */
  tenantAuthOrigin?: string;
}

export function AppsManager({ tenantAuthOrigin }: AppsManagerProps) {
  const { data: apps = [], isLoading, error: queryError } = useAppsQuery();
  const createAppMutation = useCreateAppMutation();

  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("http://localhost:3001/callback");
  const [clientType, setClientType] = useState<"public" | "confidential">("public");
  const [createdSecret, setCreatedSecret] = useState<{
    clientId: string;
    clientSecret: string;
  } | null>(null);
  const [authOrigin, setAuthOrigin] = useState("");

  useEffect(() => {
    setAuthOrigin(
      tenantAuthOrigin?.replace(/\/$/, "") || window.location.origin
    );
  }, [tenantAuthOrigin]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreatedSecret(null);

    createAppMutation.mutate(
      { name, redirectUrls: [redirectUrl], clientType },
      {
        onSuccess: (data) => {
          setCreatedSecret({
            clientId: data.app.clientId,
            clientSecret: data.clientSecret,
          });
          setName("");
        },
      }
    );
  }

  // Loader Skeletons
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="h-5 w-40 bg-slate-100 rounded-lg" />
          <div className="h-3 w-64 bg-slate-100 rounded-lg" />
          <div className="space-y-3 pt-2">
            <div className="h-10 bg-slate-100 rounded-lg" />
            <div className="h-10 bg-slate-100 rounded-lg" />
            <div className="h-10 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-indigo-100 rounded-lg mt-2" />
        </div>
        <div className="space-y-4 pt-2">
          <div className="h-5 w-32 bg-slate-100 rounded-lg" />
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex justify-between gap-4">
              <div className="h-5 w-28 bg-slate-100 rounded-lg" />
              <div className="h-5 w-48 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-3 w-56 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Workspace specific error
  if (queryError?.message === "no_workspace") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-sm text-slate-700">
        <p>Create a workspace before registering OAuth applications.</p>
        <Link
          href="/dashboard/workspace/new"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          Start onboarding →
        </Link>
      </div>
    );
  }

  // Auth specific error
  if (queryError?.message === "unauthorized") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p>Sign in to manage applications.</p>
        <Link href="/login" className="mt-2 inline-block underline font-semibold hover:text-red-900 transition">
          Sign in
        </Link>
      </div>
    );
  }

  const generalError = queryError?.message || createAppMutation.error?.message || null;

  return (
    <div className="space-y-8">
      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
      >
        <h2 className="text-base font-semibold text-slate-900 mb-1">Register application</h2>
        <p className="text-sm text-slate-500 mb-5">
          Used for SSO. Redirect URL must match exactly.
        </p>
        <div className="space-y-3">
          <input
            placeholder="App name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <input
            placeholder="Redirect URL"
            value={redirectUrl}
            onChange={(e) => setRedirectUrl(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <select
            value={clientType}
            onChange={(e) =>
              setClientType(e.target.value as "public" | "confidential")
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none px-3.5 py-2.5 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option value="public">Public — PKCE (SPA / mobile / demo)</option>
            <option value="confidential">Confidential — server uses client_secret</option>
          </select>
        </div>

        {generalError && (
          <p className="mt-3 text-sm font-medium text-red-600">{generalError}</p>
        )}

        <button
          type="submit"
          disabled={createAppMutation.isPending}
          className="mt-5 inline-flex items-center px-5 py-2.5 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {createAppMutation.isPending ? "Creating…" : "Create app"}
        </button>
      </form>

      {/* Success credential display */}
      {createdSecret && (
        <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-800 mb-3">
            ✓ App created — save these credentials now
          </p>
          <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3 font-mono text-xs text-slate-700 space-y-1.5 select-all">
            <p className="break-all">
              <span className="text-slate-400 font-semibold select-none pr-2 uppercase text-[10px] tracking-wider">client_id:</span>
              {createdSecret.clientId}
            </p>
            {clientType === "confidential" && (
              <p className="break-all">
                <span className="text-slate-400 font-semibold select-none pr-2 uppercase text-[10px] tracking-wider">client_secret:</span>
                {createdSecret.clientSecret}
              </p>
            )}
          </div>
          {clientType === "public" && (
            <p className="mt-3 text-xs text-emerald-700 leading-relaxed">
              Public apps use PKCE — do not embed client_secret in the browser.
            </p>
          )}
        </div>
      )}

      {/* App list */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Registered Applications
        </h2>
        {apps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <p className="text-sm text-slate-400">No apps registered yet.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                authOrigin={authOrigin}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
