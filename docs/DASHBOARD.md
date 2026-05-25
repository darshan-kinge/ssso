# Phase 3 — Dashboard

## Sessions (`/account`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sessions` | List active sessions (devices) |
| `DELETE` | `/api/sessions/:id` | Revoke one session |
| `POST` | `/api/sessions/revoke-all` | Revoke multiple sessions |

### Revoke all body

```json
{ "exceptCurrent": true }
```

- `true` (default): sign out **other** devices only
- `false`: sign out **everywhere** (including this browser)

Revoking the current session clears the refresh cookie and requires login again.

## Applications (`/apps`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/apps` | List your apps |
| `POST` | `/api/apps` | Create app |
| `PATCH` | `/api/apps/:id` | Update redirect URLs |
| `DELETE` | `/api/apps/:id` | Delete app |
| `POST` | `/api/apps/:id/rotate-secret` | New `client_secret` (shown once) |

Rotating a secret invalidates the previous secret immediately.

## UI

- **Account** — profile, sign out, session list, bulk revoke
- **Apps** — create, edit redirects, rotate secret, delete, copy authorize URL
