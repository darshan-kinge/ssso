"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/auth/api-client";
import { getStoredAccessToken } from "@/lib/auth/client";

export function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [preview, setPreview] = useState<{
    email: string;
    role: string;
    workspace: { name: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing invite token");
      return;
    }
    void (async () => {
      const res = await fetch(`/api/invites/preview?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid invite");
        return;
      }
      setPreview(data);
    })();
  }, [token]);

  async function accept() {
    if (!token) return;
    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      router.push(`/login?invite=${encodeURIComponent(token)}`);
      return;
    }

    setBusy(true);
    setError(null);
    const res = await authFetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Could not accept invite");
      return;
    }

    if (data.accessToken) {
      localStorage.setItem("ssso_access_token", data.accessToken);
      localStorage.setItem("ssso_active_workspace", data.workspaceId);
    }

    router.push("/apps");
    router.refresh();
  }

  if (!token) {
    return (
      <p className="text-sm text-red-400">Invalid invite link.</p>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
      <h1 className="text-xl font-semibold">Workspace invitation</h1>

      {preview && (
        <p className="mt-3 text-sm text-[var(--muted)]">
          Join <strong className="text-[var(--fg)]">{preview.workspace.name}</strong> as{" "}
          <strong className="text-[var(--fg)]">{preview.role}</strong> for{" "}
          <strong className="text-[var(--fg)]">{preview.email}</strong>.
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={busy || !preview}
          onClick={() => void accept()}
          className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
        >
          {busy ? "Joining…" : "Accept invitation"}
        </button>
        <Link
          href={`/login?invite=${encodeURIComponent(token)}`}
          className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-center text-sm"
        >
          Sign in first
        </Link>
        <Link
          href={`/signup?invite=${encodeURIComponent(token)}`}
          className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-center text-sm"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
