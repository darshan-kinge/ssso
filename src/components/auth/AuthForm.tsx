"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ACCESS_TOKEN_KEY,
  setStoredAccessToken,
} from "@/lib/auth/client";
import { getPublicConfig } from "@/lib/config";
import { getPostAuthPath } from "@/lib/auth/post-auth";
import { isTenantAuthHostClient } from "@/lib/workspace/tenant-host-client";

type Mode = "login" | "signup";

interface AuthFormProps {
  mode: Mode;
  oauthReturn?: string | null;
  inviteToken?: string | null;
}

export function AuthForm({ mode, oauthReturn = null, inviteToken = null }: AuthFormProps) {
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
      body: JSON.stringify({ email, oauthReturn }),
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
        body: JSON.stringify({ email, password, oauthReturn }),
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

      if (inviteToken) {
        const acceptRes = await fetch("/api/invites/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify({ token: inviteToken }),
        });
        const acceptData = await acceptRes.json();
        if (acceptRes.ok && acceptData.accessToken) {
          setStoredAccessToken(acceptData.accessToken);
          if (acceptData.workspaceId) {
            localStorage.setItem(
              "ssso_active_workspace",
              acceptData.workspaceId
            );
          }
          router.push("/dashboard");
          router.refresh();
          return;
        }
      }

      const tenantHost = isTenantAuthHostClient();

      if (oauthReturn) {
        window.location.assign(oauthReturn);
        return;
      }

      let hasWorkspaces = false;
      if (!tenantHost) {
        const wsRes = await fetch("/api/workspaces", {
          headers: { Authorization: `Bearer ${data.accessToken}` },
          credentials: "include",
        });
        const wsData = wsRes.ok ? await wsRes.json() : { workspaces: [] };
        hasWorkspaces = (wsData.workspaces?.length ?? 0) > 0;
        if (hasWorkspaces && wsData.workspaces[0]?.id) {
          localStorage.setItem(
            "ssso_active_workspace",
            wsData.workspaces[0].id
          );
        }
      }

      router.push(
        getPostAuthPath(hasWorkspaces, oauthReturn, { tenantHost })
      );
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
        <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input w-full px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder-slate-400 border border-slate-200 rounded-lg outline-none"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Password
          </label>
          {mode === "login" && (
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input w-full px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder-slate-400 border border-slate-200 rounded-lg outline-none"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="text-xs font-medium text-red-800 bg-red-50 border border-red-200 p-3 rounded-lg" role="alert">
          {error}
        </div>
      )}
      {info && (
        <div className="text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-200 p-3 rounded-lg" role="status">
          {info}
        </div>
      )}
      {needsVerify && (
        <button
          type="button"
          onClick={resendVerification}
          disabled={loading || !email}
          className="w-full text-xs font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-colors disabled:opacity-50"
        >
          Resend verification email
        </button>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          backgroundColor: "var(--tenant-primary, var(--accent))",
        }}
        className="auth-button w-full py-3 text-sm font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
      >
        {loading
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>

      {mode === "signup" && features.requireEmailVerification && (
        <p className="text-center text-xs font-bold text-[var(--foreground)]">
          You will need to verify your email before signing in.
        </p>
      )}

      {mode === "login" && !features.requireEmailVerification && (
        <p className="text-center text-xs font-bold text-[var(--foreground)]/60">
          Session token stored as{" "}
          <code className="bg-[var(--card)] border border-[var(--border)] px-1 py-0.5 font-mono text-[var(--foreground)]">{ACCESS_TOKEN_KEY}</code>
        </p>
      )}
    </form>
  );
}
