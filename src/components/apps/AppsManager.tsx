"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth/api-client";
import { AppCard, type AppRecord } from "@/components/dashboard/AppCard";

export function AppsManager() {
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("http://localhost:3001/callback");
  const [clientType, setClientType] = useState<"public" | "confidential">("public");
  const [error, setError] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<{
    clientId: string;
    clientSecret: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOrigin, setAuthOrigin] = useState("");

  useEffect(() => {
    setAuthOrigin(window.location.origin);
  }, []);

  const loadApps = useCallback(async () => {
    const res = await authFetch("/api/apps");

    if (res.status === 401) {
      setLoading(false);
      setError("Sign in to manage applications.");
      return;
    }

    if (!res.ok) {
      setError("Failed to load apps");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setApps(data.apps);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedSecret(null);

    const res = await authFetch("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        redirectUrls: [redirectUrl],
        clientType,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create app");
      return;
    }

    setCreatedSecret({
      clientId: data.app.clientId,
      clientSecret: data.clientSecret,
    });
    setName("");
    loadApps();
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }

  if (error && apps.length === 0) {
    return (
      <div>
        <p className="text-sm text-red-400">{error}</p>
        <Link href="/login" className="mt-4 inline-block text-sm text-[var(--accent)]">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
      >
        <h2 className="font-medium">Register application</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Used for SSO. Redirect URL must match exactly.
        </p>
        <div className="mt-4 space-y-3">
          <input
            placeholder="App name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
          <input
            placeholder="Redirect URL"
            value={redirectUrl}
            onChange={(e) => setRedirectUrl(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
          <select
            value={clientType}
            onChange={(e) =>
              setClientType(e.target.value as "public" | "confidential")
            }
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="public">Public — PKCE (SPA / mobile / demo)</option>
            <option value="confidential">Confidential — server uses client_secret</option>
          </select>
        </div>
        {error && apps.length > 0 && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        <button
          type="submit"
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Create app
        </button>
      </form>

      {createdSecret && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-200">Save these credentials now</p>
          <p className="mt-2 font-mono text-xs break-all">
            client_id: {createdSecret.clientId}
          </p>
          {clientType === "confidential" && (
            <p className="mt-1 font-mono text-xs break-all">
              client_secret: {createdSecret.clientSecret}
            </p>
          )}
          {clientType === "public" && (
            <p className="mt-2 text-xs text-amber-100/90">
              Public apps use PKCE — do not embed client_secret in the browser.
            </p>
          )}
        </div>
      )}

      <div>
        <h2 className="font-medium">Your applications</h2>
        {apps.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No apps yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                authOrigin={authOrigin}
                onUpdated={loadApps}
                onDeleted={loadApps}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
