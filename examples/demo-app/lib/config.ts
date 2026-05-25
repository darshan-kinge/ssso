export function getPublicEnv() {
  return {
    authUrl: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3000",
    clientId: process.env.NEXT_PUBLIC_ONEAUTH_CLIENT_ID ?? "",
    redirectUri:
      process.env.NEXT_PUBLIC_ONEAUTH_REDIRECT_URI ??
      "http://localhost:3001/callback",
  };
}

export function isConfigured(): boolean {
  const env = getPublicEnv();
  return Boolean(
    env.clientId &&
      process.env.ONEAUTH_CLIENT_SECRET &&
      process.env.ONEAUTH_JWT_SECRET
  );
}
