import type { Request, Response, NextFunction } from "express";
import type { AuthMiddlewareOptions } from "./types.js";
export declare function auth(options: AuthMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=middleware.d.ts.map