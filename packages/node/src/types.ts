export interface SssoJwtPayload {
  sub: string;
  email: string;
  client_id?: string;
  iat?: number;
  exp?: number;
}

export interface AuthMiddlewareOptions {
  /** Same value as SSSO JWT_SECRET */
  jwtSecret: string;
  /** Optional: require token was issued for this client_id */
  clientId?: string;
}

declare global {
  namespace Express {
    interface Request {
      sssoUser?: SssoJwtPayload;
    }
  }
}
