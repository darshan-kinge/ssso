# OneAuth test client

Minimal static app to test Phase 2 SSO locally.

**Recommended:** use the full SDK demo app — `examples/demo-app` (`npm run dev:demo` from repo root).

This folder is a minimal HTML-only client. See `docs/SDK.md` for packages.

## Setup

1. Start OneAuth: `npm run dev` (port 3000)
2. Sign up / sign in at http://localhost:3000
3. Open http://localhost:3000/apps — create app with redirect:
   - `http://localhost:3001/callback.html`
4. Copy `client_id` and `client_secret`

## Run test client on port 3001

```bash
cd examples/test-client
npx --yes serve -l 3001
```

Open http://localhost:3001 — enter credentials → **Sign in with OneAuth**.

After redirect back, the page exchanges the code for an `access_token` (demo only: secret in browser is **not** for production).

## SSO test

1. Complete login once
2. Open the authorize URL again (or click Sign in again)
3. You should be redirected immediately without re-entering password
