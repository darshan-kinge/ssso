import { connectDb, isDbConfigured } from "@/lib/db/mongoose";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { AuthError } from "@/lib/auth/errors";
import { handleApiError } from "./response";
import {
  enforceRateLimit,
  type RateLimitScope,
} from "@/lib/security/rate-limit";

type RouteHandler = (request: Request) => Promise<Response>;

export interface AuthRouteOptions {
  rateLimit?: RateLimitScope;
}

export function withAuthRoute(
  handler: RouteHandler,
  options?: AuthRouteOptions
): RouteHandler {
  return async (request) => {
    try {
      if (!isDbConfigured()) {
        throw new AuthError("Database is not configured", 503, "misconfigured");
      }
      requireAuthSecrets();
      await connectDb();

      if (options?.rateLimit) {
        await enforceRateLimit(request, options.rateLimit);
      }

      return await handler(request);
    } catch (err) {
      return handleApiError(err);
    }
  };
}
