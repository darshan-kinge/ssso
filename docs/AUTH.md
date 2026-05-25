# Phase 1 — Core authentication

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/signup` | Register (`email`, `password`) |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/refresh` | Rotate refresh token (cookie) |
| `POST` | `/api/auth/logout` | Revoke session + clear cookie |
| `GET` | `/api/auth/me` | Current user (`Authorization: Bearer`) |

## Required env

```env
MONGODB_URI=
JWT_SECRET=          # min 32 chars
REFRESH_PEPPER=      # min 32 chars
```

## Security behavior

- Passwords hashed with bcrypt (rounds from config)
- Access JWT: short-lived (default 15 min)
- Refresh token: random, stored **hashed** in `sessions`, httpOnly cookie
- Refresh rotation: old session deleted on each refresh
- Generic error on login failure (no email enumeration)

## Manual test

```bash
npm run dev
```

1. Open http://localhost:3000/signup
2. Create account → redirected to `/account`
3. Sign out → sign in again at `/login`
4. Reload `/account` — should refresh via cookie if access token expired

## curl examples

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-secure-password"}' \
  -c cookies.txt

# Me (use accessToken from response)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Refresh
curl -X POST http://localhost:3000/api/auth/refresh -b cookies.txt -c cookies.txt

# Logout
curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt
```
