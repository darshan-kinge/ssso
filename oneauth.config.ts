/**
 * OneAuth — edit this file to customize branding and auth behavior.
 * Environment variables override these values in production (see .env.example).
 */
import type { OneAuthConfig } from "./src/lib/config/types";

const config: OneAuthConfig = {
  app: {
    name: "OneAuth",
    tagline:
      "Simple developer-friendly authentication for your personal projects.",
    description: "Personal SSO platform for web, mobile, and internal apps.",
    supportEmail: "support@example.com",
  },

  urls: {
    /** Public auth base URL (no trailing slash). Override with NEXT_PUBLIC_AUTH_URL */
    authBase: "http://localhost:3000",
  },

  tokens: {
    /** Access JWT lifetime in seconds */
    accessTokenTtlSeconds: 15 * 60,
    /** Refresh token lifetime in days */
    refreshTokenTtlDays: 30,
  },

  oauth: {
    /** Authorization code lifetime in seconds */
    authorizationCodeTtlSeconds: 5 * 60,
    /** Public OAuth apps must use PKCE (SPAs, mobile) */
    requirePkceForPublicClients: true,
  },

  email: {
    verificationTokenTtlHours: 24,
    passwordResetTokenTtlHours: 1,
  },

  security: {
    /** bcrypt cost factor (10–12 recommended) */
    bcryptRounds: 12,
    /** Minimum password length */
    minPasswordLength: 8,
  },

  rateLimit: {
    windowSeconds: 60,
    emailWindowSeconds: 3600,
    loginMax: 10,
    signupMax: 5,
    refreshMax: 30,
    emailMax: 5,
    oauthTokenMax: 20,
    authActionMax: 10,
  },

  features: {
    /** Require email verification before login (Phase 5) */
    requireEmailVerification: false,
    /** MongoDB-backed rate limits on auth endpoints */
    rateLimitEnabled: true,
    /** Persist security events to audit_logs collection */
    auditLogEnabled: true,
    auditRetentionDays: 90,
  },
};

export default config;
