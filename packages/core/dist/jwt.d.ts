import type { AccessTokenClaims, SssoUser } from "./types.js";
/** Decode JWT payload without verification (client display only). */
export declare function decodeAccessToken(token: string): AccessTokenClaims | null;
export declare function userFromClaims(claims: AccessTokenClaims, isVerified?: boolean): SssoUser;
export declare function isTokenExpired(claims: AccessTokenClaims): boolean;
//# sourceMappingURL=jwt.d.ts.map