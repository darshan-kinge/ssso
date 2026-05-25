# OneAuth SDK — full demo application

A complete **consumer app** (port **3001**) that shows how to integrate all OneAuth SDKs with a real SSO flow.

## What it demonstrates

| SDK | Where in this app |
|-----|-------------------|
| **@oneauth/react** | `AuthProvider`, `useAuth()`, `ProtectedRoute` on dashboard & API demo |
| **@oneauth/core** | `/core-demo` — `OneAuthClient`, `buildAuthorizeUrl`, token decode |
| **@oneauth/node** | `/api/protected/*` — `verifyAccessToken` (same as Express `auth()`) |
| **PKCE** | Enabled by default — no secret required in browser |

## Prerequisites

1. **OneAuth** running at http://localhost:3000 (from repo root: `npm run dev`)
2. MongoDB + secrets configured in root `.env.local`
3. An app registered in OneAuth with redirect URL:

   ```
   http://localhost:3001/callback
   ```

   Create at http://localhost:3000/apps — save `client_id` and `client_secret`.

## Setup

```bash
# From repo root
cp examples/demo-app/.env.example examples/demo-app/.env.local
# Edit .env.local with your client_id, client_secret, and JWT_SECRET

npm install
npm run dev:demo
```

Open **http://localhost:3001**

## Pages

| Route | Description |
|-------|-------------|
| `/` | Overview + sign in |
| `/callback` | OAuth `redirect_uri` (code exchange via `/api/auth/callback`) |
| `/dashboard` | Protected user profile + JWT claims |
| `/api-demo` | Call `/api/protected/me` and `/data` with Bearer token |
| `/core-demo` | Direct `@oneauth/core` usage |

## Env vars

```env
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_ONEAUTH_CLIENT_ID=oa_...
ONEAUTH_CLIENT_SECRET=...
ONEAUTH_JWT_SECRET=...          # same as OneAuth JWT_SECRET
NEXT_PUBLIC_ONEAUTH_REDIRECT_URI=http://localhost:3001/callback
```

## Architecture

```txt
Browser (3001)                    OneAuth (3000)
     │                                  │
     ├─ login() ──redirect────────────► /authorize
     │◄──redirect ?code─────────────────┤
     ├─ POST /api/auth/callback ───────► POST /api/oauth/token
     │   (client_secret server-side)    │
     ├─ stores access_token             │
     └─ GET /api/protected/me           │
         Authorization: Bearer         │  (JWT signed by OneAuth)
         verify @oneauth/node           │
```

## Scripts

From **repo root**:

- `npm run dev:demo` — dev server on port 3001
- `npm run build:demo` — production build

From **this folder**:

- `npm run dev` / `npm run build`

## SSO test

1. Sign in on the demo app
2. Open http://localhost:3000 in another tab (optional)
3. Click **Re-authorize (SSO test)** on the dashboard — you should return without entering a password
