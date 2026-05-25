# OneAuth configuration

## Quick start

1. Copy `.env.example` → `.env.local`
2. Edit **`oneauth.config.ts`** at the repo root for defaults (name, tagline, token TTLs, etc.)
3. Use **environment variables** in production to override without code changes

## `oneauth.config.ts`

Single file for non-secret settings:

| Section | Keys | Purpose |
|---------|------|---------|
| `app` | `name`, `tagline`, `description`, `supportEmail` | Branding & metadata |
| `urls` | `authBase` | Public auth URL (SSO cookie domain) |
| `tokens` | `accessTokenTtlSeconds`, `refreshTokenTtlDays` | Session lifetimes |
| `security` | `bcryptRounds`, `minPasswordLength` | Password policy |
| `features` | `requireEmailVerification` | Phase 5 toggle |

**Never put secrets in this file.** Use `.env.local` only.

## Environment overrides

| Variable | Overrides |
|----------|-----------|
| `NEXT_PUBLIC_APP_NAME` | `app.name` |
| `NEXT_PUBLIC_APP_TAGLINE` | `app.tagline` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | `app.description` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `app.supportEmail` |
| `NEXT_PUBLIC_AUTH_URL` | `urls.authBase` |
| `ACCESS_TOKEN_TTL_SECONDS` | `tokens.accessTokenTtlSeconds` |
| `REFRESH_TOKEN_TTL_DAYS` | `tokens.refreshTokenTtlDays` |
| `BCRYPT_ROUNDS` | `security.bcryptRounds` |
| `MIN_PASSWORD_LENGTH` | `security.minPasswordLength` |
| `REQUIRE_EMAIL_VERIFICATION` | `features.requireEmailVerification` |
| `AUTHORIZATION_CODE_TTL_SECONDS` | `oauth.authorizationCodeTtlSeconds` |

## Using config in code

```ts
import { getConfig, getPublicConfig } from "@/lib/config";

// Server: full config + secrets check
const config = getConfig();

// Client-safe / API responses (no secrets)
const publicConfig = getPublicConfig();
```

## Health check

`GET /api/health` returns app name, DB status, and whether secrets are set (not their values).
