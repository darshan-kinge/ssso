# Pulse — real-world OneAuth demo

**Pulse** is a sample team workspace (projects + tasks) that shows how a production app integrates OneAuth — not a bare SDK playground.

Runs on **http://localhost:3001** against OneAuth on **:3000**.

## What it demonstrates

| Real-world pattern | Implementation |
|--------------------|----------------|
| Marketing landing + app | `/` → sign in → `/projects` |
| OAuth + PKCE | `@oneauth/react` + server `/api/auth/callback` |
| Protected UI | `ProtectedRoute` on app pages |
| Protected REST API | `/api/projects/*` with `@oneauth/node` `verifyAccessToken` |
| Per-user data | JWT `sub` scopes in-memory project store |
| Account / SSO | `/settings`, re-authorize, link to OneAuth `/account` |
| Integrator docs | `/dev` — API tester + flow diagram |

## Prerequisites

1. OneAuth: `npm run dev` (repo root)
2. MongoDB + secrets in root `.env.local`
3. **SaaS mode:** create a workspace at http://localhost:3000/workspace/new (e.g. slug `acme`), register a **public** app on http://localhost:3000/dashboard with redirect `http://localhost:3001/callback`
4. **Personal mode:** register at http://localhost:3000/apps instead

Full SaaS walkthrough: **[docs/SAAS-E2E.md](../../docs/SAAS-E2E.md)**

## Setup

```bash
cp examples/demo-app/.env.example examples/demo-app/.env.local
# NEXT_PUBLIC_ONEAUTH_CLIENT_ID, ONEAUTH_JWT_SECRET (same as OneAuth JWT_SECRET)
# ONEAUTH_CLIENT_SECRET optional when using PKCE

npm install
npm run dev:demo
```

Open **http://localhost:3001** → **Sign in with OneAuth** → manage projects.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing (redirects to projects when signed in) |
| `/projects` | Project list + create |
| `/projects/[id]` | Tasks for a project |
| `/settings` | Profile, sign out, SSO test |
| `/callback` | OAuth redirect (do not link manually) |
| `/dev` | SDK / API reference for developers |
| `/dashboard`, `/api-demo`, `/core-demo` | Redirect to new routes |

## Env

**SaaS (tenant OAuth):**

```env
NEXT_PUBLIC_AUTH_URL=http://acme.localhost:3000
NEXT_PUBLIC_ONEAUTH_WORKSPACE_SLUG=acme
NEXT_PUBLIC_ONEAUTH_CLIENT_ID=oa_...
ONEAUTH_JWT_SECRET=...
NEXT_PUBLIC_ONEAUTH_REDIRECT_URI=http://localhost:3001/callback
```

**Personal (single host):**

```env
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_ONEAUTH_CLIENT_ID=oa_...
```

## Architecture

```txt
Browser (Pulse :3001)              Tenant (acme.localhost:3000)
     │                                    │
     ├─ login() PKCE ───────────────────► /authorize
     │◄── ?code ──────────────────────────┤
     ├─ POST /api/auth/callback ─────────► POST /api/oauth/token
     ├─ Bearer on /api/projects ─────────► JWT verified (@oneauth/node)
     └─ UI: projects, tasks, settings
```

**Note:** Project data is stored in memory (resets on server restart / cold start). Suitable for demo; use a database in production.

## Scripts

- Repo root: `npm run dev:demo`, `npm run build:demo`
- This folder: `npm run dev`, `npm run build`
