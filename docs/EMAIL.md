# Phase 5 — Email verification & password reset

## Features

- **Verify email** — link expires per `email.verificationTokenTtlHours` (default 24h)
- **Resend verification** — no account enumeration
- **Forgot password** — generic success message
- **Reset password** — single-use token (default 1h)

## Enable verification requirement

In `oneauth.config.ts` or env:

```env
REQUIRE_EMAIL_VERIFICATION=true
```

When enabled:

- Signup does **not** issue a session until email is verified
- Login returns `403` / `email_not_verified` until verified

## Email delivery

### Development (default)

Without Resend configured, emails print to the **server console** with full links.

### Production (Resend)

```env
RESEND_API_KEY=re_...
EMAIL_FROM=OneAuth <onboarding@resend.dev>
```

Uses [Resend](https://resend.com) HTTP API (serverless-friendly).

## API

| Method | Path | Body |
|--------|------|------|
| `POST` | `/api/auth/verify-email` | `{ "token": "..." }` |
| `POST` | `/api/auth/resend-verification` | `{ "email": "..." }` |
| `POST` | `/api/auth/forgot-password` | `{ "email": "..." }` |
| `POST` | `/api/auth/reset-password` | `{ "token", "password" }` |

## Pages

| Path | Purpose |
|------|---------|
| `/verify-email?token=` | Confirm email (from link) |
| `/forgot-password` | Request reset |
| `/reset-password?token=` | Set new password |

## Config

```ts
// oneauth.config.ts
email: {
  verificationTokenTtlHours: 24,
  passwordResetTokenTtlHours: 1,
},
```

Env overrides: `VERIFICATION_TOKEN_TTL_HOURS`, `PASSWORD_RESET_TOKEN_TTL_HOURS`

## Test locally

1. Set `REQUIRE_EMAIL_VERIFICATION=true` in `.env.local`
2. Sign up — check terminal for verification URL
3. Open link → `/verify-email?token=...`
4. Sign in
5. Use **Forgot password** on login — check console for reset link
