const DEFAULT_TOKEN_KEY = "ssso_access_token";
const DEFAULT_STATE_KEY = "ssso_oauth_state";
const DEFAULT_PKCE_KEY = "ssso_code_verifier";

export function createStorage(
  storageKey?: string,
  stateKey?: string,
  pkceKey?: string
) {
  const tokenKey = storageKey ?? DEFAULT_TOKEN_KEY;
  const oauthStateKey = stateKey ?? DEFAULT_STATE_KEY;
  const codeVerifierKey = pkceKey ?? DEFAULT_PKCE_KEY;

  return {
    getToken(): string | null {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(tokenKey);
    },
    setToken(token: string): void {
      localStorage.setItem(tokenKey, token);
    },
    clearToken(): void {
      localStorage.removeItem(tokenKey);
    },
    setOAuthState(state: string): void {
      sessionStorage.setItem(oauthStateKey, state);
    },
    getOAuthState(): string | null {
      return sessionStorage.getItem(oauthStateKey);
    },
    clearOAuthState(): void {
      sessionStorage.removeItem(oauthStateKey);
    },
    setCodeVerifier(verifier: string): void {
      sessionStorage.setItem(codeVerifierKey, verifier);
    },
    getCodeVerifier(): string | null {
      return sessionStorage.getItem(codeVerifierKey);
    },
    takeCodeVerifier(): string | null {
      const v = sessionStorage.getItem(codeVerifierKey);
      if (v) sessionStorage.removeItem(codeVerifierKey);
      return v;
    },
  };
}
