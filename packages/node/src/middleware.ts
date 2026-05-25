import type { Request, Response, NextFunction } from "express";
import type { AuthMiddlewareOptions } from "./types.js";
import { extractBearerToken, verifyAccessToken } from "./verify.js";

export function auth(options: AuthMiddlewareOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({ error: "Missing access token", code: "unauthorized" });
      return;
    }

    try {
      req.oneauthUser = verifyAccessToken(token, options);
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token", code: "invalid_token" });
    }
  };
}
