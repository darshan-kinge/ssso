# Phase 4 — SDKs

## Packages

| Package | Use |
|---------|-----|
| `@oneauth/core` | OAuth client, token storage, JWT decode |
| `@oneauth/react` | `AuthProvider`, `useAuth()`, `ProtectedRoute` |
| `@oneauth/node` | Express `auth()` middleware |

Build from repo root:

```bash
npm install
npm run build:packages
```

## Environment (consumer app)

```env
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_ONEAUTH_CLIENT_ID=oa_xxx
ONEAUTH_CLIENT_SECRET=...        # server only
ONEAUTH_JWT_SECRET=...           # same as OneAuth JWT_SECRET
NEXT_PUBLIC_ONEAUTH_REDIRECT_URI=http://localhost:3001/callback
```

## React (under 5 minutes)

```tsx
// app/providers.tsx
"use client";
import { AuthProvider } from "@oneauth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider
      config={{
        authUrl: process.env.NEXT_PUBLIC_AUTH_URL!,
        clientId: process.env.NEXT_PUBLIC_ONEAUTH_CLIENT_ID!,
        redirectUri: process.env.NEXT_PUBLIC_ONEAUTH_REDIRECT_URI!,
      }}
      callbackApiUrl="/api/auth/callback"
    >
      {children}
    </AuthProvider>
  );
}
```

```tsx
// app/page.tsx
"use client";
import { useAuth, ProtectedRoute } from "@oneauth/react";

export default function Home() {
  const { user, login, logout } = useAuth();

  return (
    <ProtectedRoute
      fallback={<p>Loading…</p>}
      unauthenticated={<p>Please sign in.</p>}
    >
      <p>Signed in as {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </ProtectedRoute>
  );
}
```

### Server callback route (Next.js)

```ts
// app/api/auth/callback/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code, redirect_uri } = await request.json();
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL!.replace(/\/$/, "");

  const res = await fetch(`${authUrl}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: process.env.NEXT_PUBLIC_ONEAUTH_CLIENT_ID,
      client_secret: process.env.ONEAUTH_CLIENT_SECRET,
      redirect_uri,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}
```

**Full example app:** `examples/demo-app/` — run with `npm run dev:demo` from repo root.

Legacy template: `examples/nextjs-consumer/`

## Express API

```js
import express from "express";
import { auth } from "@oneauth/node";

const app = express();

app.get("/api/me", auth({ jwtSecret: process.env.ONEAUTH_JWT_SECRET }), (req, res) => {
  res.json({ user: req.oneauthUser });
});
```

See `examples/express-api/`

## Core API (vanilla JS)

```js
import { OneAuthClient } from "@oneauth/core";

const client = new OneAuthClient({
  authUrl: "http://localhost:3000",
  clientId: "oa_xxx",
  redirectUri: "http://localhost:3001/callback",
});

document.getElementById("login").onclick = () => client.login();
// On callback page:
const { accessToken, user } = await client.handleCallback(location.search, {
  clientSecret: "...", // dev only — use handleCallbackViaApi in production
});
```

## PKCE (default in SDK)

`OneAuthClient` uses PKCE S256 by default. Set `usePkce: false` only for confidential server-side clients using `client_secret`.

## Security notes

- Never ship `clientSecret` in frontend production builds — use PKCE or server callback
- Verify JWTs on your API with `@oneauth/node` and shared `JWT_SECRET`
- `getUser()` in the browser decodes JWT without verification (display only)
