# Next.js consumer template

Copy these files into a separate Next.js app that uses OneAuth SSO.

## Files to copy

- `app/api/auth/callback/route.ts` — server-side code exchange
- Use `@oneauth/react` in your app (see `docs/SDK.md`)

## Env

```env
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_ONEAUTH_CLIENT_ID=oa_xxx
ONEAUTH_CLIENT_SECRET=your_secret
ONEAUTH_JWT_SECRET=same_as_oneauth_jwt_secret
NEXT_PUBLIC_ONEAUTH_REDIRECT_URI=http://localhost:3001/callback
```

Register `http://localhost:3001/callback` (or your path) in OneAuth `/apps`.

## Link packages (monorepo)

From your consumer app:

```json
"dependencies": {
  "@oneauth/react": "file:../ssso/packages/react",
  "@oneauth/core": "file:../ssso/packages/core"
}
```

Or publish / `npm run build:packages` and install from workspace.
