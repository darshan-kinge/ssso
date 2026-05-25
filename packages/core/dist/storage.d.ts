export declare function createStorage(storageKey?: string, stateKey?: string, pkceKey?: string): {
    getToken(): string | null;
    setToken(token: string): void;
    clearToken(): void;
    setOAuthState(state: string): void;
    getOAuthState(): string | null;
    clearOAuthState(): void;
    setCodeVerifier(verifier: string): void;
    getCodeVerifier(): string | null;
    takeCodeVerifier(): string | null;
};
//# sourceMappingURL=storage.d.ts.map