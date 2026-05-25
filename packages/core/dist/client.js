import { createStorage } from "./storage.js";
import { decodeAccessToken, isTokenExpired, userFromClaims } from "./jwt.js";
import { generateCodeVerifier, codeChallengeS256 } from "./pkce.js";
function normalizeAuthUrl(url) {
    return url.replace(/\/$/, "");
}
function randomState() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
export class OneAuthClient {
    constructor(config) {
        this.config = config;
        this.authUrl = normalizeAuthUrl(config.authUrl);
        this.storage = createStorage(config.storageKey, config.stateKey);
        this.usePkce = config.usePkce !== false;
    }
    /** Build OAuth authorize URL (with optional PKCE S256) */
    async buildAuthorizeUrl(state = randomState()) {
        this.storage.setOAuthState(state);
        const q = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            response_type: "code",
            state,
        });
        if (this.usePkce) {
            const verifier = generateCodeVerifier();
            this.storage.setCodeVerifier(verifier);
            const challenge = await codeChallengeS256(verifier);
            q.set("code_challenge", challenge);
            q.set("code_challenge_method", "S256");
        }
        return `${this.authUrl}/authorize?${q}`;
    }
    /** Redirect browser to OneAuth login */
    async login(state) {
        if (typeof window === "undefined") {
            throw new Error("login() requires a browser environment");
        }
        window.location.href = await this.buildAuthorizeUrl(state ?? randomState());
    }
    /** Parse callback query string and validate state */
    parseCallback(search) {
        const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
        const code = params.get("code");
        const state = params.get("state");
        const error = params.get("error");
        if (error) {
            throw new Error(params.get("error_description") ?? error);
        }
        if (!code || !state) {
            throw new Error("Missing code or state in callback URL");
        }
        const expected = this.storage.getOAuthState();
        if (!expected || state !== expected) {
            throw new Error("Invalid OAuth state — possible CSRF");
        }
        this.storage.clearOAuthState();
        return { code, state };
    }
    tokenExchangeBody(code) {
        const body = {
            grant_type: "authorization_code",
            code,
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
        };
        const verifier = this.storage.takeCodeVerifier();
        if (verifier) {
            body.code_verifier = verifier;
            return body;
        }
        const secret = this.config.clientSecret;
        if (!secret) {
            throw new Error("No code_verifier or clientSecret — enable PKCE or use server-side exchange");
        }
        body.client_secret = secret;
        return body;
    }
    /** Exchange authorization code for access token */
    async exchangeCode(code) {
        const res = await fetch(`${this.authUrl}/api/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.tokenExchangeBody(code)),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error ?? "Token exchange failed");
        }
        return data;
    }
    async handleCallback(search, options) {
        const { code } = this.parseCallback(search);
        if (options?.clientSecret) {
            this.config.clientSecret = options.clientSecret;
        }
        const data = await this.exchangeCode(code);
        this.setToken(data.access_token);
        return {
            accessToken: data.access_token,
            user: {
                id: data.user.id,
                email: data.user.email,
                isVerified: data.user.isVerified,
            },
        };
    }
    getToken() {
        return this.storage.getToken();
    }
    setToken(token) {
        this.storage.setToken(token);
    }
    clearToken() {
        this.storage.clearToken();
    }
    getUser() {
        const token = this.getToken();
        if (!token)
            return null;
        const claims = decodeAccessToken(token);
        if (!claims?.sub || !claims.email)
            return null;
        if (isTokenExpired(claims))
            return null;
        return userFromClaims(claims);
    }
    isAuthenticated() {
        return this.getUser() !== null;
    }
    async handleCallbackViaApi(search, apiUrl) {
        const { code } = this.parseCallback(search);
        const verifier = this.storage.takeCodeVerifier();
        const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code,
                redirect_uri: this.config.redirectUri,
                ...(verifier ? { code_verifier: verifier } : {}),
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error ?? "Token exchange failed");
        }
        const accessToken = data.access_token ?? data.accessToken;
        if (!accessToken) {
            throw new Error("No access token in response");
        }
        this.setToken(accessToken);
        const user = data.user ?? this.getUser() ?? {
            id: "",
            email: "",
        };
        return { accessToken, user };
    }
    logout() {
        this.clearToken();
    }
}
