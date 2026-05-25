import type { OneAuthConfig, OneAuthUser, TokenResponse } from "./types.js";
export declare class OneAuthClient {
    private readonly config;
    private readonly authUrl;
    private readonly storage;
    private readonly usePkce;
    constructor(config: OneAuthConfig);
    /** Build OAuth authorize URL (with optional PKCE S256) */
    buildAuthorizeUrl(state?: string): Promise<string>;
    /** Redirect browser to OneAuth login */
    login(state?: string): Promise<void>;
    /** Parse callback query string and validate state */
    parseCallback(search: string): {
        code: string;
        state: string;
    };
    private tokenExchangeBody;
    /** Exchange authorization code for access token */
    exchangeCode(code: string): Promise<TokenResponse>;
    handleCallback(search: string, options?: {
        clientSecret?: string;
    }): Promise<{
        accessToken: string;
        user: OneAuthUser;
    }>;
    getToken(): string | null;
    setToken(token: string): void;
    clearToken(): void;
    getUser(): OneAuthUser | null;
    isAuthenticated(): boolean;
    handleCallbackViaApi(search: string, apiUrl: string): Promise<{
        accessToken: string;
        user: OneAuthUser;
    }>;
    logout(): void;
}
//# sourceMappingURL=client.d.ts.map