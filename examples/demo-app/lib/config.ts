export function getPublicEnv() {
  const slug = process.env.NEXT_PUBLIC_SSSO_WORKSPACE_SLUG?.trim();
  const explicitAuth = process.env.NEXT_PUBLIC_AUTH_URL?.replace(/\/$/, "");
  const suffix =
    process.env.NEXT_PUBLIC_TENANT_DOMAIN_SUFFIX ?? "localhost:3000";

  const authUrl =
    explicitAuth ??
    (slug ? `http://${slug}.${suffix}` : "http://localhost:3000");

  return {
    authUrl,
    workspaceSlug: slug ?? null,
    clientId: process.env.NEXT_PUBLIC_SSSO_CLIENT_ID ?? "",
    redirectUri:
      process.env.NEXT_PUBLIC_SSSO_REDIRECT_URI ??
      "http://localhost:3001/callback",
  };
}

export function isConfigured(): boolean {
  const env = getPublicEnv();
  return Boolean(env.clientId && process.env.SSSO_JWT_SECRET);
}

export function isTenantMode(): boolean {
  const { authUrl } = getPublicEnv();
  try {
    const host = new URL(authUrl).host;
    return host.includes(".localhost") || host.split(".").length > 2;
  } catch {
    return false;
  }
}
