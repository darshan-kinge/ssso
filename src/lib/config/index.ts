import baseConfig from "../../../oneauth.config";
import type { OneAuthConfig, ResolvedOneAuthConfig } from "./types";

function env(key: string): string | undefined {
  const v = process.env[key];
  return v === "" ? undefined : v;
}

function envInt(key: string, fallback: number): number {
  const raw = env(key);
  if (raw === undefined) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = env(key);
  if (raw === undefined) return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

/**
 * Merges `oneauth.config.ts` with environment overrides.
 * - Branding / TTLs: optional env overrides (see .env.example)
 * - Secrets: env only, never in oneauth.config.ts
 */
export function getConfig(): ResolvedOneAuthConfig {
  const file = baseConfig as OneAuthConfig;

  return {
    app: {
      name: env("NEXT_PUBLIC_APP_NAME") ?? file.app.name,
      tagline: env("NEXT_PUBLIC_APP_TAGLINE") ?? file.app.tagline,
      description:
        env("NEXT_PUBLIC_APP_DESCRIPTION") ?? file.app.description,
      supportEmail:
        env("NEXT_PUBLIC_SUPPORT_EMAIL") ?? file.app.supportEmail,
    },
    urls: {
      authBase:
        env("NEXT_PUBLIC_AUTH_URL") ??
        file.urls.authBase,
    },
    tokens: {
      accessTokenTtlSeconds: envInt(
        "ACCESS_TOKEN_TTL_SECONDS",
        file.tokens.accessTokenTtlSeconds
      ),
      refreshTokenTtlDays: envInt(
        "REFRESH_TOKEN_TTL_DAYS",
        file.tokens.refreshTokenTtlDays
      ),
    },
    oauth: {
      authorizationCodeTtlSeconds: envInt(
        "AUTHORIZATION_CODE_TTL_SECONDS",
        file.oauth.authorizationCodeTtlSeconds
      ),
      requirePkceForPublicClients: envBool(
        "REQUIRE_PKCE_FOR_PUBLIC_CLIENTS",
        file.oauth.requirePkceForPublicClients
      ),
    },
    email: {
      verificationTokenTtlHours: envInt(
        "VERIFICATION_TOKEN_TTL_HOURS",
        file.email.verificationTokenTtlHours
      ),
      passwordResetTokenTtlHours: envInt(
        "PASSWORD_RESET_TOKEN_TTL_HOURS",
        file.email.passwordResetTokenTtlHours
      ),
    },
    security: {
      bcryptRounds: envInt("BCRYPT_ROUNDS", file.security.bcryptRounds),
      minPasswordLength: envInt(
        "MIN_PASSWORD_LENGTH",
        file.security.minPasswordLength
      ),
    },
    rateLimit: {
      windowSeconds: envInt(
        "RATE_LIMIT_WINDOW_SECONDS",
        file.rateLimit.windowSeconds
      ),
      emailWindowSeconds: envInt(
        "RATE_LIMIT_EMAIL_WINDOW_SECONDS",
        file.rateLimit.emailWindowSeconds
      ),
      loginMax: envInt("RATE_LIMIT_LOGIN_MAX", file.rateLimit.loginMax),
      signupMax: envInt("RATE_LIMIT_SIGNUP_MAX", file.rateLimit.signupMax),
      refreshMax: envInt("RATE_LIMIT_REFRESH_MAX", file.rateLimit.refreshMax),
      emailMax: envInt("RATE_LIMIT_EMAIL_MAX", file.rateLimit.emailMax),
      oauthTokenMax: envInt(
        "RATE_LIMIT_OAUTH_TOKEN_MAX",
        file.rateLimit.oauthTokenMax
      ),
      authActionMax: envInt(
        "RATE_LIMIT_AUTH_ACTION_MAX",
        file.rateLimit.authActionMax
      ),
    },
    features: {
      requireEmailVerification: envBool(
        "REQUIRE_EMAIL_VERIFICATION",
        file.features.requireEmailVerification
      ),
      rateLimitEnabled: envBool(
        "RATE_LIMIT_ENABLED",
        file.features.rateLimitEnabled
      ),
      auditLogEnabled: envBool(
        "AUDIT_LOG_ENABLED",
        file.features.auditLogEnabled
      ),
      auditRetentionDays: envInt(
        "AUDIT_RETENTION_DAYS",
        file.features.auditRetentionDays
      ),
    },
    secrets: {
      mongodbUri: env("MONGODB_URI"),
      jwtSecret: env("JWT_SECRET"),
      refreshPepper: env("REFRESH_PEPPER"),
      resendApiKey: env("RESEND_API_KEY"),
      emailFrom: env("EMAIL_FROM"),
    },
  };
}

export function isEmailConfigured(): boolean {
  const { resendApiKey, emailFrom } = getConfig().secrets;
  return Boolean(resendApiKey && emailFrom);
}

/** Client-safe subset (no secrets) */
export function getPublicConfig() {
  const c = getConfig();
  return {
    app: c.app,
    urls: c.urls,
    features: {
      requireEmailVerification: c.features.requireEmailVerification,
    },
  };
}

export type { OneAuthConfig, ResolvedOneAuthConfig };
