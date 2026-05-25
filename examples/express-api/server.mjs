/**
 * Minimal Express API protected with @oneauth/node
 *
 *   npm install express @oneauth/node
 *   ONEAUTH_JWT_SECRET=... node server.mjs
 */
import express from "express";
import { auth } from "@oneauth/node";

const app = express();
const port = 4000;

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get(
  "/api/me",
  auth({ jwtSecret: process.env.ONEAUTH_JWT_SECRET }),
  (req, res) => {
    res.json({ user: req.oneauthUser });
  }
);

app.listen(port, () => {
  console.log(`API http://localhost:${port}`);
  console.log("Call with: Authorization: Bearer <access_token from OneAuth>");
});
