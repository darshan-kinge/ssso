# Mobile & VR SSO with OneAuth

OneAuth uses a **browser-based OAuth flow** — the recommended approach for Android, VR (Quest), and other non-web clients.

## Why browser SSO?

- No `client_secret` in the app binary
- No custom password handling in VR
- Reuses the same `/authorize` flow as web apps
- Auth-domain cookie enables **instant SSO** after first login

## Flow (with PKCE)

```txt
Your App (VR / Android)
    │
    ├─ Generate code_verifier + code_challenge (S256)
    ├─ Open system browser or WebView
    │     GET {AUTH_URL}/authorize?...&code_challenge=...&code_challenge_method=S256
    │
    ├─ User signs in (or SSO if session exists on auth domain)
    │
    ├─ Redirect to your registered redirect_uri
    │     myapp://callback?code=...&state=...
    │
    ├─ App receives deep link
    │
    └─ Exchange on YOUR BACKEND with code_verifier (no client_secret in app)
          POST {AUTH_URL}/api/oauth/token
          { code, client_id, redirect_uri, code_verifier }
          → access_token
```

## Setup

### 1. Register redirect URI

Use a **custom URL scheme** or app link:

```
myapp://oauth/callback
```

Register it in OneAuth `/apps` (must match exactly).

### 2. Android (Kotlin) — outline

```kotlin
// Build authorize URL (same query params as web)
val url = "${AUTH_URL}/authorize?" +
  "client_id=$CLIENT_ID&" +
  "redirect_uri=${Uri.encode("myapp://oauth/callback")}&" +
  "response_type=code&" +
  "state=$randomState"

// Custom Tabs
CustomTabsIntent.Builder().build().launchUrl(context, Uri.parse(url))

// In Activity handling myapp://oauth/callback
// Send code to your API → your API calls OneAuth /api/oauth/token
```

Store `access_token` in EncryptedSharedPreferences or Android Keystore.

### 3. VR / Quest — outline

1. Show QR code or button: “Sign in”
2. Open Meta Horizon browser (or embedded WebView if platform allows)
3. Complete OneAuth login
4. Deep link back to VR app with `code`
5. Exchange on backend; store token securely

**Future (Phase 7+):** QR login — phone scans, headset receives session.

## SDK usage

| Platform | Package |
|----------|---------|
| Web / React | `@oneauth/react` |
| Node API | `@oneauth/node` |
| Any JS | `@oneauth/core` |

See `examples/demo-app` for a full reference implementation.

## Security checklist

- [ ] Use HTTPS for `AUTH_URL` in production
- [ ] Validate `state` on callback (SDK does this automatically)
- [ ] Exchange `code` server-side only
- [ ] Verify JWTs with `@oneauth/node` and shared `JWT_SECRET`
- [ ] Do not log access tokens

## Demo

Run the web demo to understand the flow before porting to mobile:

```bash
npm run dev        # OneAuth :3000
npm run dev:demo   # Consumer :3001
```
