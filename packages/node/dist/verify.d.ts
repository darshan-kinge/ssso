import type { AuthMiddlewareOptions, OneAuthJwtPayload } from "./types.js";
export declare function extractBearerToken(authorization: string | undefined | null): string | null;
export declare function verifyAccessToken(token: string, options: AuthMiddlewareOptions): OneAuthJwtPayload;
//# sourceMappingURL=verify.d.ts.map