"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ACCESS_TOKEN_KEY,
  setStoredAccessToken,
} from "@/lib/auth/client";
import { getPublicConfig } from "@/lib/config";

type Mode = "login" | "signup";

interface AuthFormProps {
  mode: Mode;
  oauthReturn?: string | null;
}

export function AuthForm({ mode, oauthReturn = null }: AuthFormProps) {
  const router = useRouter();
  const { features } = getPublicConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";

  async function resendVerification() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    setInfo(data.message ?? "Verification email sent if applicable.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setNeedsVerify(false);
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "email_not_verified") {
          setNeedsVerify(true);
        }
        setError(data.error ?? "Something went wrong");
        return;
      }

      if (data.verificationRequired) {
        setInfo(data.message ?? "Check your email to verify your account.");
        return;
      }

      if (data.accessToken) {
        setStoredAccessToken(data.accessToken);
      }

      router.push(oauthReturn ?? "/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-[var(--muted)]">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm text-[var(--muted)]"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        {mode === "login" && (
          <p className="mt-2 text-right text-xs">
            <Link
              href="/forgot-password"
              className="text-[var(--accent)] hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {info && (
        <p className="text-sm text-[var(--accent)]" role="status">
          {info}
        </p>
      )}
      {needsVerify && (
        <button
          type="button"
          onClick={resendVerification}
          disabled={loading || !email}
          className="w-full text-sm text-[var(--accent)] hover:underline disabled:opacity-50"
        >
          Resend verification email
        </button>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>

      {mode === "signup" && features.requireEmailVerification && (
        <p className="text-center text-xs text-[var(--muted)]">
          You will need to verify your email before signing in.
        </p>
      )}

      {mode === "login" && !features.requireEmailVerification && (
        <p className="text-center text-xs text-[var(--muted)]">
          Session token stored as{" "}
          <code className="rounded bg-[var(--card)] px-1">{ACCESS_TOKEN_KEY}</code>
        </p>
      )}
    </form>
  );
}
