export interface SssoConfig {
  app: {
    name: string;
    tagline: string;
    description: string;
    supportEmail: string;
  };
  urls: {
    authBase: string;
    platformBase?: string;
  };
  deployment: {
    mode: "personal" | "saas";
    tenantDomainSuffix: string;
    reservedSlugs: string[];
  };
  tokens: {
    accessTokenTtlSeconds: number;
    refreshTokenTtlDays: number;
  };
  oauth: {
    /** Authorization code lifetime in seconds */
    authorizationCodeTtlSeconds: number;
    /** Require PKCE on /authorize for apps with clientType public */
    requirePkceForPublicClients: boolean;
  };
  email: {
    verificationTokenTtlHours: number;
    passwordResetTokenTtlHours: number;
    inviteTokenTtlHours: number;
  };
  security: {
    bcryptRounds: number;
    minPasswordLength: number;
  };
  rateLimit: {
    windowSeconds: number;
    emailWindowSeconds: number;
    loginMax: number;
    signupMax: number;
    refreshMax: number;
    emailMax: number;
    oauthTokenMax: number;
    authActionMax: number;
  };
  features: {
    requireEmailVerification: boolean;
    rateLimitEnabled: boolean;
    auditLogEnabled: boolean;
    auditRetentionDays: number;
    /** Workspace + end-user split; subdomain tenancy in saas mode */
    multiTenant: boolean;
  };
}

/** Resolved config after merging file defaults + environment */
export interface ResolvedSssoConfig extends SssoConfig {
  urls: {
    authBase: string;
    platformBase: string;
  };
  secrets: {
    mongodbUri: string | undefined;
    jwtSecret: string | undefined;
    refreshPepper: string | undefined;
    resendApiKey: string | undefined;
    emailFrom: string | undefined;
    redisUrl: string | undefined;
  };
}
