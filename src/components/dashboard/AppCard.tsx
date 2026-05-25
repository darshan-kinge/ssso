"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/api-client";
import { AuthorizeUrlSample } from "@/components/apps/AuthorizeUrlSample";

export interface AppRecord {
  id: string;
  name: string;
  clientId: string;
  clientType: "public" | "confidential";
  redirectUrls: string[];
}

interface AppCardProps {
  app: AppRecord;
  authOrigin: string;
  onUpdated: () => void;
  onDeleted: () => void;
}

export function AppCard({ app, authOrigin, onUpdated, onDeleted }: AppCardProps) {
  const [editing, setEditing] = useState(false);
  const [redirectUrls, setRedirectUrls] = useState(app.redirectUrls.join("\n"));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [clientType, setClientType] = useState(app.clientType ?? "public");

  useEffect(() => {
    setClientType(app.clientType ?? "public");
  }, [app.clientType]);

  async function saveRedirects() {
    setBusy("save");
    setError(null);
    const urls = redirectUrls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    const res = await authFetch(`/api/apps/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirectUrls: urls, clientType }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      setBusy(null);
      return;
    }

    setEditing(false);
    setBusy(null);
    onUpdated();
  }

  async function rotateSecret() {
    if (!confirm(`Rotate secret for "${app.name}"? The old secret stops working immediately.`)) {
      return;
    }

    setBusy("rotate");
    setError(null);
    setNewSecret(null);

    const res = await authFetch(`/api/apps/${app.id}/rotate-secret`, {
      method: "POST",
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Rotation failed");
      setBusy(null);
      return;
    }

    setNewSecret(data.clientSecret);
    setBusy(null);
  }

  async function deleteApp() {
    if (!confirm(`Delete "${app.name}"? This cannot be undone.`)) return;

    setBusy("delete");
    const res = await authFetch(`/api/apps/${app.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Delete failed");
      setBusy(null);
      return;
    }

    onDeleted();
  }

  const primaryRedirect = app.redirectUrls[0];

  return (
    <li className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{app.name}</p>
          <span className="mt-1 inline-block rounded bg-[var(--background)] px-1.5 py-0.5 text-xs text-[var(--muted)]">
            {clientType}
          </span>
        </div>
        <span className="font-mono text-xs text-[var(--muted)]">{app.clientId}</span>
      </div>

      {editing && (
        <div className="mt-3">
          <label className="text-xs text-[var(--muted)]">Client type</label>
          <select
            value={clientType}
            onChange={(e) =>
              setClientType(e.target.value as "public" | "confidential")
            }
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs"
          >
            <option value="public">Public (PKCE required)</option>
            <option value="confidential">Confidential (server secret)</option>
          </select>
        </div>
      )}

      {editing ? (
        <div className="mt-3 space-y-2">
          <label className="text-xs text-[var(--muted)]">
            Redirect URLs (one per line)
          </label>
          <textarea
            value={redirectUrls}
            onChange={(e) => setRedirectUrls(e.target.value)}
            rows={3}
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 font-mono text-xs"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy === "save"}
              onClick={saveRedirects}
              className="rounded bg-[var(--accent)] px-3 py-1 text-xs text-white"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setRedirectUrls(app.redirectUrls.join("\n"));
              }}
              className="rounded border border-[var(--border)] px-3 py-1 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 break-all text-xs text-[var(--muted)]">
          {app.redirectUrls.join(" · ")}
        </p>
      )}

      {authOrigin && primaryRedirect && (
        <AuthorizeUrlSample
          authOrigin={authOrigin}
          clientId={app.clientId}
          redirectUri={primaryRedirect}
          clientType={clientType}
        />
      )}

      {newSecret && (
        <div className="mt-3 rounded border border-amber-500/40 bg-amber-500/10 p-2 font-mono text-xs break-all">
          New client_secret: {newSecret}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Edit redirects
          </button>
        )}
        <button
          type="button"
          disabled={busy !== null}
          onClick={rotateSecret}
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          {busy === "rotate" ? "Rotating…" : "Rotate secret"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={deleteApp}
          className="text-xs text-red-400 hover:text-red-300"
        >
          {busy === "delete" ? "Deleting…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
