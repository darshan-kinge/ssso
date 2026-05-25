"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getPublicConfig } from "@/lib/config";

export function ResetPasswordContent() {
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
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">Choose new password</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{app.name}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          ← Sign in
        </Link>
      </p>
    </main>
  );
}
