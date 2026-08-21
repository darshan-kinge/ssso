export interface SssoConfig {
    /** SSSO base URL, e.g. https://auth.example.com */
    authUrl: string;
    clientId: string;
    /** Server-side only — never expose in browser bundles */
    clientSecret?: string;
    /** Registered callback URL for this app */
    redirectUri: string;
    /** localStorage key for access token */
    storageKey?: string;
    /** sessionStorage key for OAuth state */
    stateKey?: string;
    /** Use PKCE (recommended for public / mobile clients). Default: true */
    usePkce?: boolean;
}
export interface SssoUser {
    id: string;
    email: string;
    isVerified?: boolean;
    clientId?: string;
}
export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: {
        id: string;
        email: string;
        isVerified: boolean;
    };
}
export interface AccessTokenClaims {
    sub: string;
    email: string;
    client_id?: string;
    exp?: number;
    iat?: number;
}
export interface WorkspacePublicConfig {
    multiTenant: boolean;
    id?: string;
    slug?: string;
    name: string;
    settings: {
        logoUrl: string | null;
        primaryColor: string | null;
        themeType: "neo-brutalist" | "simple-bg" | "custom-colors";
        loginMode: "open" | "sso-only";
    };
}
//# sourceMappingURL=types.d.ts.map