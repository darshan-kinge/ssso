/** RFC 7636 PKCE helpers (browser or Node 18+). */
export declare function generateCodeVerifier(): string;
export declare function codeChallengeS256(verifier: string): Promise<string>;
export declare function storeCodeVerifier(verifier: string, key?: string): void;
export declare function takeCodeVerifier(key?: string): string | null;
export declare const PKCE_VERIFIER_KEY = "oneauth_code_verifier";
//# sourceMappingURL=pkce.d.ts.map