import type { AuthMiddlewareOptions, SssoJwtPayload } from "./types.js";
export declare function extractBearerToken(authorization: string | undefined | null): string | null;
export declare function verifyAccessToken(token: string, options: AuthMiddlewareOptions): SssoJwtPayload;
//# sourceMappingURL=verify.d.ts.map