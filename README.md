# OneAuth

Personal SSO platform for your own apps — simple, serverless, developer-first.

Single sign-on across web, APIs, and mobile (browser flow). Built with **Next.js**, **MongoDB Atlas**, and deployable on **Vercel**.

## Features

- Email/password auth with JWT + rotating refresh cookies
- OAuth2-style **authorization code** SSO
- **PKCE** for public clients (mobile / SPA)
- App dashboard (redirect URLs, secret rotation)
- Session & audit management
- Rate limiting + security headers
- SDKs: `@oneauth/core`, `@oneauth/react`, `@oneauth/node`

## Quick start

### 1. Configure

```bash
cp .env.example .env.local
# Set MONGODB_URI, JWT_SECRET (32+ chars), REFRESH_PEPPER (32+ chars)
```

Edit branding in [`oneauth.config.ts`](oneauth.config.ts).

### 2. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 3. Register a consumer app

1. Sign up at http://localhost:3000/signup  
2. Go to **My apps** → create app with redirect URL  
3. **Public** (default): save `client_id` only — use PKCE via SDK  
4. **Confidential**: also save `client_secret` for server-side token exchange

### 4. Try Pulse (demo consumer, port 3001)

```bash
cp examples/demo-app/.env.example examples/demo-app/.env.local
# Fill client_id, JWT_SECRET (PKCE public app — secret optional)

npm run dev:demo
```

**Pulse** is a realistic sample app (projects, tasks, protected APIs). See [examples/demo-app/README.md](examples/demo-app/README.md).

## Project layout

```txt
src/                 # OneAuth server (Next.js)
packages/
  core/              # @oneauth/core
  react/             # @oneauth/react
  node/              # @oneauth/node
examples/
  demo-app/          # Full SDK integration example
docs/                # Phase docs (AUTH, OAUTH, SDK, EMAIL, SECURITY, …)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | OneAuth on :3000 |
| `npm run dev:demo` | Demo consumer on :3001 |
| `npm run build` | Build SDKs + server |
| `npm run build:packages` | SDK packages only |
| `npm test` | Unit + integration tests (needs `MONGODB_URI` for integration) |
| `npm run test:unit` | PKCE / policy tests only |

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md) for Vercel + MongoDB Atlas.

## Documentation

- [AUTH.md](docs/AUTH.md) — login, signup, sessions  
- [OAUTH.md](docs/OAUTH.md) — SSO + **PKCE**  
- [SDK.md](docs/SDK.md) — integration guide  
- [EMAIL.md](docs/EMAIL.md) — verification & reset  
- [SECURITY.md](docs/SECURITY.md) — rate limits, audit  
- [MOBILE-SSO.md](docs/MOBILE-SSO.md) — Android / VR  
- [DEPLOY.md](docs/DEPLOY.md) — Vercel production setup  
- [MULTI-TENANT.md](docs/MULTI-TENANT.md) — SaaS plan (split users, subdomains)  

## PKCE (public clients)

No `client_secret` in the app — use PKCE S256:

```ts
import { OneAuthClient } from "@oneauth/core";

const client = new OneAuthClient({
  authUrl: "http://localhost:3000",
  clientId: "oa_...",
  redirectUri: "http://localhost:3001/callback",
  usePkce: true, // default
});

await client.login();
// callback → exchange with code_verifier only
```

## License

Private / personal use — add a license if you open-source.
