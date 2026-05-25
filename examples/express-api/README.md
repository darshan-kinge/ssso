# Express API example

```bash
cd examples/express-api
npm install express @oneauth/node
set ONEAUTH_JWT_SECRET=your_oneauth_jwt_secret
node server.mjs
```

Get an access token via SSO (`examples/test-client` or `@oneauth/react`), then:

```bash
curl http://localhost:4000/api/me -H "Authorization: Bearer ACCESS_TOKEN"
```
