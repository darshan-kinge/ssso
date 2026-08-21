"use client";

import { useEffect, useState } from "react";
import { AuthorizeUrlSample } from "@/components/apps/AuthorizeUrlSample";
import { useUpdateAppMutation, useRotateSecretMutation, useDeleteAppMutation } from "@/hooks/useApps";

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
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export function AppCard({ app, authOrigin, onUpdated, onDeleted }: AppCardProps) {
  const [editing, setEditing] = useState(false);
  const [redirectUrls, setRedirectUrls] = useState(app.redirectUrls.join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [clientType, setClientType] = useState(app.clientType ?? "public");

  const updateAppMutation = useUpdateAppMutation();
  const rotateSecretMutation = useRotateSecretMutation();
  const deleteAppMutation = useDeleteAppMutation();

  const isSaving = updateAppMutation.isPending;
  const isRotating = rotateSecretMutation.isPending;
  const isDeleting = deleteAppMutation.isPending;
  const busy = isSaving || isRotating || isDeleting;

  useEffect(() => {
    setClientType(app.clientType ?? "public");
  }, [app.clientType]);

  async function saveRedirects() {
    setError(null);
    const urls = redirectUrls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    updateAppMutation.mutate(
      { id: app.id, redirectUrls: urls, clientType },
      {
        onSuccess: () => {
          setEditing(false);
          onUpdated?.();
        },
        onError: (err) => {
          setError(err.message || "Update failed");
        },
      }
    );
  }

  async function rotateSecret() {
    if (!confirm(`Rotate secret for "${app.name}"? The old secret stops working immediately.`)) {
      return;
    }

    setError(null);
    setNewSecret(null);

    rotateSecretMutation.mutate(app.id, {
      onSuccess: (secret) => {
        setNewSecret(secret);
        onUpdated?.();
      },
      onError: (err) => {
        setError(err.message || "Rotation failed");
      },
    });
  }

  async function deleteApp() {
    if (!confirm(`Delete "${app.name}"? This cannot be undone.`)) return;

    setError(null);

    deleteAppMutation.mutate(app.id, {
      onSuccess: () => {
        onDeleted?.();
      },
      onError: (err) => {
        setError(err.message || "Delete failed");
      },
    });
  }

  const primaryRedirect = app.redirectUrls[0];

  return (
    <li className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-none">{app.name}</h3>
          <span className="mt-2.5 inline-block rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {clientType} app
          </span>
        </div>
        <span className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded select-all self-start">
          {app.clientId}
        </span>
      </div>

      {editing && (
        <div className="mt-4 space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Client type</label>
          <select
            value={clientType}
            onChange={(e) =>
              setClientType(e.target.value as "public" | "confidential")
            }
            className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none cursor-pointer focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
          >
            <option value="public">Public (PKCE required)</option>
            <option value="confidential">Confidential (server secret)</option>
          </select>
        </div>
      )}

      {editing ? (
        <div className="mt-4 space-y-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Redirect URLs (one per line)
          </label>
          <textarea
            value={redirectUrls}
            onChange={(e) => setRedirectUrls(e.target.value)}
            rows={3}
            className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={saveRedirects}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setRedirectUrls(app.redirectUrls.join("\n"));
              }}
              className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Redirect URLs</span>
          <p className="font-mono text-xs text-slate-600 font-medium break-all leading-normal">
            {app.redirectUrls.join(" · ")}
          </p>
        </div>
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
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 font-mono text-xs text-slate-700 break-all select-all leading-normal">
          <span className="text-red-700 font-semibold select-none uppercase text-[10px] tracking-wider pr-1">new_client_secret:</span> {newSecret}
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-indigo-600 hover:text-indigo-500 hover:underline transition-colors"
          >
            Edit Redirects
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={rotateSecret}
          className="text-slate-600 hover:text-slate-900 hover:underline transition disabled:opacity-50"
        >
          {isRotating ? "Rotating…" : "Rotate Secret"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={deleteApp}
          className="text-red-600 hover:text-red-500 hover:underline transition disabled:opacity-50"
        >
          {isDeleting ? "Deleting…" : "Delete Application"}
        </button>
      </div>
    </li>
  );
}
