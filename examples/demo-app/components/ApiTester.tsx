"use client";

import { useState } from "react";
import { useAuth } from "@ssso/react";

export function ApiTester() {
  const { token, isAuthenticated } = useAuth();
  const [endpoint, setEndpoint] = useState("/api/protected/me");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function callApi() {
    if (!token) return;
    setLoading(true);
    setResult("");

    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      setResult(
        JSON.stringify({ status: res.status, ok: res.ok, body }, null, 2)
      );
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-[var(--muted)]">Sign in to test protected APIs.</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Sends your access token as{" "}
        <code className="rounded bg-[var(--card)] px-1">Authorization: Bearer</code>.
        Routes are verified with <code>@ssso/node</code>.
      </p>
      <select
        value={endpoint}
        onChange={(e) => setEndpoint(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
      >
        <option value="/api/projects">GET /api/projects</option>
        <option value="/api/protected/me">GET /api/protected/me</option>
        <option value="/api/protected/data">GET /api/protected/data</option>
      </select>
      <button
        type="button"
        onClick={callApi}
        disabled={loading}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {loading ? "Calling…" : "Call protected API"}
      </button>
      {result && (
        <pre className="max-h-80 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-xs">
          {result}
        </pre>
      )}
    </div>
  );
}
