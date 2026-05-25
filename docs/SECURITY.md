# Phase 6 — Security hardening

## Rate limiting

MongoDB-backed counters (works on Vercel serverless). Limits are **per IP** per window.

| Scope | Default | Window |
|-------|---------|--------|
| `login` | 10 | 60s |
| `signup` | 5 | 60s |
| `refresh` | 30 | 60s |
| `email` (forgot / resend) | 5 | 1 hour |
| `oauth_token` | 20 | 60s |
| `auth_action` (verify / reset) | 10 | 60s |

When exceeded: `429` / `rate_limited`.

### Config

```ts
// oneauth.config.ts
rateLimit: {
  windowSeconds: 60,
  emailWindowSeconds: 3600,
  loginMax: 10,
  signupMax: 5,
  // ...
},
features: {
  rateLimitEnabled: true,
},
```

Disable: `RATE_LIMIT_ENABLED=false`

## Audit log

Events stored in `audit_logs` with TTL (`auditRetentionDays`, default 90).

### Logged actions

- `login.success` / `login.failed`
- `signup.success` / `signup.failed`
- `logout`, `refresh.*`
- `session.revoke`, `session.revoke_all`
- `oauth.token.*`
- `email.verify.*`, `email.resend`
- `password.reset.*`

### View your activity

- **Account page** — Security activity section
- **API** — `GET /api/audit` (Bearer token)

Disable: `AUDIT_LOG_ENABLED=false`

## HTTP security headers

Set via `src/middleware.ts`:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cache-Control: no-store` on `/api/*`

## OAuth client types & PKCE

- **Public** (default): `/authorize` must include `code_challenge` (S256); token exchange uses `code_verifier` only.
- **Confidential**: server may use `client_secret` at token (PKCE optional on authorize).

Toggle enforcement: `REQUIRE_PKCE_FOR_PUBLIC_CLIENTS` (default `true`). See [OAUTH.md](./OAUTH.md).

## Mobile / VR SSO

See [MOBILE-SSO.md](./MOBILE-SSO.md) for browser-based login and deep-link callback patterns.

## Health check

`GET /api/health` includes `rateLimitEnabled` and `auditLogEnabled`.
