# SaaS end-to-end: platform dashboard → tenant OAuth → demo app

This walkthrough verifies the full multi-tenant loop locally.

## Prerequisites

- OneAuth: `npm run dev` (port **3000**)
- MongoDB + `JWT_SECRET` / `REFRESH_PEPPER` in root `.env.local`
- `oneauth.config.ts`: `deployment.mode: "saas"`, `features.multiTenant: true`
- `tenantDomainSuffix` matches dev hosts (default `localhost:3000`)

## 1. Platform: create workspace

1. Open **http://localhost:3000** → sign up / sign in.
2. Complete **http://localhost:3000/workspace/new** (e.g. workspace **acme**, subdomain `acme`).
3. Open **http://localhost:3000/dashboard** — copy the **tenant auth URL**:
   `http://acme.localhost:3000`

> Reserved subdomains are listed in `oneauth.config.ts` (`demo`, `api`, etc.). Do not use those as workspace slugs.

## 2. Platform: register OAuth app

On the dashboard (platform host):

1. Register a **public** app (PKCE).
2. Redirect URL: `http://localhost:3001/callback`
3. Save `client_id` (and `client_secret` if confidential).

Apps are scoped to the active workspace.

## 3. Configure Pulse demo (tenant auth URL)

```bash
cp examples/demo-app/.env.example examples/demo-app/.env.local
```

Edit `examples/demo-app/.env.local`:

```env
# Must be the TENANT host (not localhost:3000 platform)
NEXT_PUBLIC_AUTH_URL=http://acme.localhost:3000
NEXT_PUBLIC_ONEAUTH_WORKSPACE_SLUG=acme

NEXT_PUBLIC_ONEAUTH_CLIENT_ID=oa_...
ONEAUTH_JWT_SECRET=<same as OneAuth JWT_SECRET>
NEXT_PUBLIC_ONEAUTH_REDIRECT_URI=http://localhost:3001/callback
```

## 4. Run demo and sign in

```bash
npm run dev:demo
```

1. Open **http://localhost:3001**
2. **Sign in with OneAuth** — browser should hit **acme.localhost:3000** (tenant), not platform.
3. Use an **end-user** account on the tenant host (sign up on tenant if needed).
4. After callback, Pulse loads projects with a valid access token.

## 5. Verify

| Check | Expected |
|-------|----------|
| Authorize URL host | `acme.localhost:3000` |
| Token `sub` | End-user id (not platform user) |
| Wrong tenant host + `client_id` | Rejected (workspace mismatch) |
| OAuth opened on platform host | Auto-redirects to tenant `/authorize` |
| After tenant login during OAuth | Returns to `/authorize` → redirect to Pulse with `code` |
| Account → Security activity | Events tagged with `plane` + `workspaceId` |
| Tenant login rate limit | Key includes workspace slug (per-tenant isolation) |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Redirect to platform login | Set `NEXT_PUBLIC_AUTH_URL` to tenant URL |
| `invalid_client` / workspace mismatch | App registered in different workspace than tenant slug |
| `no_workspace` on dashboard | Complete onboarding; activate workspace |
| Subdomain not resolving | Use `*.localhost:3000` (Chrome/Edge) or map `acme.localhost` in hosts |

## Architecture

```txt
Platform (localhost:3000)          Tenant (acme.localhost:3000)
  Dashboard, apps, team      →       End-user login, /authorize
  Platform JWT + cookies             End-user JWT + tenant refresh cookie
```

Pulse (`:3001`) talks only to the **tenant** host for OAuth; platform is for operators only.
