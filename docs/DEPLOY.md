# Deploy OneAuth (Vercel + MongoDB Atlas)

## 1. MongoDB Atlas

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Database user + password.
3. Network access: allow Vercel (or `0.0.0.0/0` for personal use).
4. Copy connection string → `MONGODB_URI` (include database name, e.g. `.../oneauth`).

## 2. Generate secrets

```bash
# 32+ random characters each
openssl rand -base64 32   # → JWT_SECRET
openssl rand -base64 32   # → REFRESH_PEPPER
```

## 3. Vercel project

1. Import this repo in [vercel.com](https://vercel.com).
2. Framework: **Next.js** (auto-detected).
3. Root directory: `.` (monorepo root — not `examples/demo-app`).

### Environment variables (Production)

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGODB_URI` | yes | Atlas connection string |
| `JWT_SECRET` | yes | min 32 chars |
| `REFRESH_PEPPER` | yes | min 32 chars |
| `NEXT_PUBLIC_AUTH_URL` | yes | `https://your-app.vercel.app` (no trailing slash) |
| `NEXT_PUBLIC_PLATFORM_URL` | yes (SaaS) | Dashboard origin, e.g. `https://app.ssso.in` |
| `TENANT_DOMAIN_SUFFIX` | yes (SaaS) | Tenant suffix, e.g. `ssso.in` |
| `DEPLOYMENT_MODE` | yes (SaaS) | `saas` |
| `MULTI_TENANT_ENABLED` | yes (SaaS) | `true` |
| `NEXT_PUBLIC_APP_NAME` | optional | Branding |
| `RESEND_API_KEY` | optional | Email |
| `EMAIL_FROM` | optional | With Resend |
| `REDIS_URL` | recommended | Atomic rate limiting across serverless instances |
| `REQUIRE_EMAIL_VERIFICATION` | optional | `true` when email is live |
| `REQUIRE_PKCE_FOR_PUBLIC_CLIENTS` | optional | default `true` |

4. Deploy.

5. Open `https://your-app.vercel.app/api/health` — expect `"ok": true`.

## 4. Register consumer apps

1. Sign up on your deployed URL.
2. **My apps** → create app:
   - **Public** + PKCE for SPA / mobile / demo (recommended).
   - **Confidential** for server-only `client_secret` exchange.
3. Set redirect URL to your consumer’s production callback (HTTPS).

## 5. Wire a consumer app

### Public client (PKCE)

```env
NEXT_PUBLIC_AUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_ONEAUTH_CLIENT_ID=oa_...
NEXT_PUBLIC_ONEAUTH_REDIRECT_URI=https://your-consumer.com/callback
```

Use `@oneauth/core` / `@oneauth/react` with `usePkce: true` (default).  
Do **not** put `client_secret` in the browser.

### Confidential client (server callback)

```env
NEXT_PUBLIC_AUTH_URL=https://your-app.vercel.app
ONEAUTH_CLIENT_ID=oa_...
ONEAUTH_CLIENT_SECRET=...
ONEAUTH_REDIRECT_URI=https://your-consumer.com/api/auth/callback
```

Exchange the code on your server only. See [examples/demo-app](examples/demo-app/README.md).

## 6. Pulse demo app (optional)

**Pulse** (`examples/demo-app`) is a realistic consumer sample (projects + tasks). Deploy as a **second** Vercel project, or run locally:

```bash
# examples/demo-app/.env.local
NEXT_PUBLIC_AUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_ONEAUTH_CLIENT_ID=oa_...
NEXT_PUBLIC_ONEAUTH_REDIRECT_URI=http://localhost:3001/callback
```

## 7. CI

GitHub Actions runs lint, unit tests, integration tests (Mongo service), and `npm run build` on push/PR. See [.github/workflows/ci.yml](../.github/workflows/ci.yml).

Local integration tests:

```bash
# Use a dedicated test DB name (_test or _ci) — integration tests wipe all collections
MONGODB_URI=mongodb://127.0.0.1:27017/oneauth_test npm test
```

## Checklist

- [ ] `NEXT_PUBLIC_AUTH_URL` matches deployed domain
- [ ] SaaS platform URL and tenant domain suffix match DNS
- [ ] Redirect URLs in `/apps` match consumer callbacks exactly
- [ ] Public consumers use PKCE; secrets only on server
- [ ] Email configured before enabling `REQUIRE_EMAIL_VERIFICATION`
