const DEFAULT_TOKEN_KEY = "ssso_access_token";
const DEFAULT_STATE_KEY = "ssso_oauth_state";
const DEFAULT_PKCE_KEY = "ssso_code_verifier";
export function createStorage(storageKey, stateKey, pkceKey) {
    const tokenKey = storageKey ?? DEFAULT_TOKEN_KEY;
    const oauthStateKey = stateKey ?? DEFAULT_STATE_KEY;
    const codeVerifierKey = pkceKey ?? DEFAULT_PKCE_KEY;
    return {
        getToken() {
            if (typeof localStorage === "undefined")
                return null;
            return localStorage.getItem(tokenKey);
        },
        setToken(token) {
            localStorage.setItem(tokenKey, token);
        },
        clearToken() {
            localStorage.removeItem(tokenKey);
        },
        setOAuthState(state) {
            sessionStorage.setItem(oauthStateKey, state);
        },
        getOAuthState() {
            return sessionStorage.getItem(oauthStateKey);
        },
        clearOAuthState() {
            sessionStorage.removeItem(oauthStateKey);
        },
        setCodeVerifier(verifier) {
            sessionStorage.setItem(codeVerifierKey, verifier);
        },
        getCodeVerifier() {
            return sessionStorage.getItem(codeVerifierKey);
        },
        takeCodeVerifier() {
            const v = sessionStorage.getItem(codeVerifierKey);
            if (v)
                sessionStorage.removeItem(codeVerifierKey);
            return v;
        },
    };
}
