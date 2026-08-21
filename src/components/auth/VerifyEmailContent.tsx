"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPublicConfig } from "@/lib/config";
import { resolveThemeSettings } from "@/lib/workspace/theme-resolver";

interface VerifyEmailContentProps {
  tenantWorkspace?: {
    name: string;
    settings?: {
      logoUrl?: string | null;
      primaryColor?: string | null;
      themeType?: string | null;
      backgroundImageUrl?: string | null;
      backgroundColor?: string | null;
      customCardBg?: string | null;
      customCardBorder?: string | null;
      customCardText?: string | null;
      customButtonBg?: string | null;
      customButtonText?: string | null;
    } | null;
  } | null;
}

export function VerifyEmailContent({ tenantWorkspace }: VerifyEmailContentProps) {
  const { app } = getPublicConfig();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");
  const [oauthReturn, setOauthReturn] = useState<string | null>(null);

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
        if (data.oauthReturn) {
          setOauthReturn(data.oauthReturn);
        }
      })
      .catch(() => {
        setStatus("error");
      });
  }, [token]);

  const getLoginHref = () => {
    if (!oauthReturn) return "/login";
    if (oauthReturn.startsWith("/authorize")) {
      return oauthReturn.replace("/authorize", "/login");
    }
    try {
      if (oauthReturn.startsWith("http://") || oauthReturn.startsWith("https://")) {
        const url = new URL(oauthReturn);
        if (url.pathname === "/authorize") {
          url.pathname = "/login";
        }
        return url.toString();
      }
    } catch {
      // Ignore URL parsing errors
    }
    return oauthReturn;
  };

  const theme = resolveThemeSettings(tenantWorkspace?.settings);

  return (
    <div 
      className={`flex min-h-screen flex-col items-center justify-center p-6 ${theme.themeClass}`}
      style={theme.outerStyle}
    >
      <main className={theme.cardClass}>
        {tenantWorkspace?.settings?.logoUrl ? (
          <div className="mb-6 flex justify-center">
            <img
              src={tenantWorkspace.settings.logoUrl}
              alt={`${tenantWorkspace.name} logo`}
              className="auth-logo-img max-h-16 max-w-full object-contain p-2"
            />
          </div>
        ) : null}

        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Verify email</h1>
        <p className="auth-info-box mt-4 text-sm text-[var(--foreground)]/70 leading-relaxed p-4 bg-slate-50 border border-slate-100 rounded-lg">
          For your {tenantWorkspace ? tenantWorkspace.name : app.name} account.
        </p>

        <div className="auth-status-box mt-6 p-4 rounded-xl text-center">
          {status === "loading" && (
            <p className="text-sm font-medium text-slate-400 animate-pulse">Verifying…</p>
          )}
          {status === "ok" && (
            <>
              <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-lg">{message}</p>
              <Link
                href={getLoginHref()}
                style={{
                  backgroundColor: "var(--tenant-primary, var(--accent))",
                }}
                className="auth-button mt-6 inline-flex w-full items-center justify-center py-3 text-sm font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                Sign in →
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <p className="text-sm font-semibold text-red-700 bg-red-50 border border-red-100 p-3 rounded-lg">{message}</p>
              <Link
                href="/login"
                className="mt-6 inline-flex w-full items-center justify-center py-3 text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
