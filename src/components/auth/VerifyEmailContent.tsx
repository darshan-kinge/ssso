"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPublicConfig } from "@/lib/config";

export function VerifyEmailContent() {
  const { app } = getPublicConfig();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error ?? "Verification failed");
          return;
        }
        setStatus("ok");
        setMessage(data.message ?? "Email verified.");
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error");
      });
  }, [token]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">Verify email</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{app.name}</p>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
        {status === "loading" && (
          <p className="text-sm text-[var(--muted)]">Verifying…</p>
        )}
        {status === "ok" && (
          <>
            <p className="text-sm text-[var(--accent)]">{message}</p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
            >
              Sign in →
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-sm text-red-400">{message}</p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm text-[var(--muted)] hover:underline"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
