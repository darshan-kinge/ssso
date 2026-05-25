"use client";

import { useEffect, useMemo, useState } from "react";
import { OneAuthClient } from "@oneauth/core";
import { getPublicEnv } from "@/lib/config";
import { useAuth } from "@oneauth/react";

/**
 * Shows @oneauth/core used directly (without going through useAuth),
 * useful for non-React apps or custom flows.
 */
export default function CoreDemoPage() {
  const { isAuthenticated, token: ctxToken } = useAuth();
  const env = getPublicEnv();
  const client = useMemo(
    () =>
      new OneAuthClient({
        authUrl: env.authUrl,
        clientId: env.clientId,
        redirectUri: env.redirectUri,
        storageKey: "oneauth_demo_core_token",
      }),
    [env.authUrl, env.clientId, env.redirectUri]
  );

  const [coreToken, setCoreToken] = useState<string | null>(null);
  const [coreUser, setCoreUser] = useState<string>("");
  const [authorizeUrl, setAuthorizeUrl] = useState<string>("");

  useEffect(() => {
    setCoreToken(client.getToken());
    const u = client.getUser();
    setCoreUser(u ? JSON.stringify(u, null, 2) : "null");
    setAuthorizeUrl(client.buildAuthorizeUrl("demo-state"));
  }, [client, ctxToken]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Core SDK</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          <code>OneAuthClient</code> from{" "}
          <code className="text-[var(--fg)]">@oneauth/core</code> with a
          separate storage key. React auth uses{" "}
          <code className="text-[var(--fg)]">oneauth_access_token</code> by
          default.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void client.login()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
          >
            client.login()
          </button>
          <button
            type="button"
            onClick={() => {
              client.setToken(ctxToken ?? "");
              setCoreToken(client.getToken());
              setCoreUser(JSON.stringify(client.getUser(), null, 2));
            }}
            disabled={!ctxToken}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-50"
          >
            Copy token from React session
          </button>
          <button
            type="button"
            onClick={() => {
              client.clearToken();
              setCoreToken(null);
              setCoreUser("null");
            }}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
          >
            client.logout()
          </button>
        </div>

        <div>
          <p className="text-xs text-[var(--muted)]">buildAuthorizeUrl()</p>
          <p className="mt-1 break-all font-mono text-xs">
            {authorizeUrl || "(client only)"}
          </p>
        </div>

        <div>
          <p className="text-xs text-[var(--muted)]">getToken() / getUser()</p>
          <pre className="mt-2 rounded-lg bg-black/40 p-4 text-xs overflow-auto">
            {`token: ${coreToken ? coreToken.slice(0, 40) + "…" : "null"}\nuser: ${coreUser}`}
          </pre>
        </div>

        <p className="text-sm text-[var(--muted)]">
          React session active: {isAuthenticated ? "yes" : "no"}
        </p>
      </div>
    </div>
  );
}
