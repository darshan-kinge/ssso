import type { AccessTokenClaims, OneAuthUser } from "./types.js";
/** Decode JWT payload without verification (client display only). */
export declare function decodeAccessToken(token: string): AccessTokenClaims | null;
export declare function userFromClaims(claims: AccessTokenClaims, isVerified?: boolean): OneAuthUser;
export declare function isTokenExpired(claims: AccessTokenClaims): boolean;
//# sourceMappingURL=jwt.d.ts.map