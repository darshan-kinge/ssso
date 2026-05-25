"use client";

import { useState } from "react";
import Link from "next/link";
import { getPublicConfig } from "@/lib/config";

export default function ForgotPasswordPage() {
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
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Enter your {app.name} account email. We&apos;ll send a reset link if the
        account exists.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-[var(--accent)]">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </main>
  );
}
