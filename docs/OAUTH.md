# Phase 2 — SSO (authorization code flow)

## Flow

```txt
Your App  →  GET /authorize?client_id&redirect_uri&response_type=code&state
          →  User signs in (or SSO if session exists on auth domain)
          →  Redirect to redirect_uri?code=...&state=...
Your App  →  POST /api/oauth/token  (exchange code + client_secret OR code_verifier)
          →  { access_token, token_type, expires_in, user }
```

## Client types

| Type | Authorize | Token exchange |
|------|-----------|----------------|
| **public** (default) | `code_challenge` + `code_challenge_method=S256` required | `code_verifier` only — no `client_secret` |
| **confidential** | PKCE optional | `client_secret` or PKCE |

Set type when registering at `/apps` or via API (`clientType`). Existing apps without a stored type are treated as **public**.

Disable the public PKCE requirement globally: `REQUIRE_PKCE_FOR_PUBLIC_CLIENTS=false` in env (not recommended).

## PKCE (public clients — required by default)

Add to authorize URL:

```
&code_challenge=CHALLENGE&code_challenge_method=S256
```

Exchange with **`code_verifier` only** (no `client_secret`):

```json
{
  "grant_type": "authorization_code",
  "code": "...",
  "client_id": "oa_xxx",
  "redirect_uri": "http://localhost:3001/callback",
  "code_verifier": "YOUR_VERIFIER"
}
```

`@oneauth/core` enables PKCE by default (`usePkce: true`). CORS on `/api/oauth/token` allows origins from registered redirect URLs.

## 1. Register an application

Sign in at `/account`, then open **`/apps`** and create an app with a redirect URL (e.g. `http://localhost:3001/callback`).

Save `client_id` and `client_secret` — the secret is shown **once**.

Or via API:

```bash
curl -X POST http://localhost:3000/api/apps \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo","redirectUrls":["http://localhost:3001/callback"]}'
```

## 2. Authorize URL

```
{AUTH_URL}/authorize?client_id=oa_xxx&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fcallback&response_type=code&state=random
```

- `redirect_uri` must **exactly** match a registered URL
- `state` is echoed back for CSRF protection
- If the user already has an auth-domain session → **instant redirect** (SSO)

## 3. Exchange code for token

```bash
curl -X POST http://localhost:3000/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "CODE_FROM_CALLBACK",
    "client_id": "oa_xxx",
    "client_secret": "YOUR_SECRET",
    "redirect_uri": "http://localhost:3001/callback"
  }'
```

Response:

```json
{
  "access_token": "jwt...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": { "id": "...", "email": "...", "isVerified": true }
}
```

The JWT includes `client_id` for the requesting app. Refresh tokens stay on the **auth domain** only (httpOnly cookie), not sent to third-party apps.

## 4. Test client

See `examples/test-client/` — static HTML callback page + instructions.

## API summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/authorize` | — | Start OAuth (browser) |
| `POST` | `/api/oauth/authorize` | cookie | Complete authorize when logged in |
| `POST` | `/api/oauth/token` | client_secret | Exchange code |
| `GET` | `/api/apps` | Bearer | List your apps |
| `POST` | `/api/apps` | Bearer | Create app |
| `PATCH` | `/api/apps/:id` | Bearer | Update redirect URLs |

## Config

In `oneauth.config.ts`:

```ts
oauth: {
  authorizationCodeTtlSeconds: 5 * 60,
}
```

Override: `AUTHORIZATION_CODE_TTL_SECONDS`
