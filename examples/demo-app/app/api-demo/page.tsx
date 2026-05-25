"use client";

import { ProtectedRoute } from "@oneauth/react";
import { ApiTester } from "@/components/ApiTester";
import { SignedOutPanel } from "@/components/SignedOutPanel";

export default function ApiDemoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API demo</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Server routes verify JWTs with{" "}
          <code className="text-[var(--fg)]">@oneauth/node</code> — the same
          verifier used by Express <code className="text-[var(--fg)]">auth()</code>{" "}
          middleware.
        </p>
      </div>

      <ProtectedRoute
        fallback={<p className="text-[var(--muted)]">Loading…</p>}
        unauthenticated={<SignedOutPanel />}
      >
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <ApiTester />
        </div>
      </ProtectedRoute>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm">
        <h2 className="font-medium">Express equivalent</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-4 text-xs text-[var(--muted)]">
{`import express from "express";
import { auth } from "@oneauth/node";

app.get("/api/me", auth({ jwtSecret: process.env.ONEAUTH_JWT_SECRET }), (req, res) => {
  res.json({ user: req.oneauthUser });
});`}
        </pre>
        <p className="mt-3 text-[var(--muted)]">
          See also <code>examples/express-api/server.mjs</code> in the repo.
        </p>
      </section>
    </div>
  );
}
