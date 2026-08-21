import { getConfig } from "@/lib/config";
import { connectDb } from "@/lib/db/mongoose";
import { RateLimit } from "@/lib/models/RateLimit";
import { AuthError } from "@/lib/auth/errors";
import { getClientIp } from "./client-ip";
import { HEADER_PLANE, HEADER_WORKSPACE_SLUG } from "@/lib/workspace/headers";
import { getRedisClient } from "@/lib/db/redis";

export type RateLimitScope =
  | "login"
  | "signup"
  | "refresh"
  | "email"
  | "oauth_token"
  | "auth_action";

function limitsForScope(scope: RateLimitScope): {
  max: number;
  windowSeconds: number;
} {
  const { rateLimit } = getConfig();
  switch (scope) {
    case "login":
      return { max: rateLimit.loginMax, windowSeconds: rateLimit.windowSeconds };
    case "signup":
      return { max: rateLimit.signupMax, windowSeconds: rateLimit.windowSeconds };
    case "refresh":
      return {
        max: rateLimit.refreshMax,
        windowSeconds: rateLimit.windowSeconds,
      };
    case "email":
      return {
        max: rateLimit.emailMax,
        windowSeconds: rateLimit.emailWindowSeconds,
      };
    case "oauth_token":
      return {
        max: rateLimit.oauthTokenMax,
        windowSeconds: rateLimit.windowSeconds,
      };
    case "auth_action":
      return {
        max: rateLimit.authActionMax,
        windowSeconds: rateLimit.windowSeconds,
      };
  }
}

function rateLimitKey(request: Request, scope: RateLimitScope): string {
  const ip = getClientIp(request);
  const plane = request.headers.get(HEADER_PLANE);
  const slug = request.headers.get(HEADER_WORKSPACE_SLUG);

  if (plane === "tenant" && slug) {
    return `${scope}:tenant:${slug}:${ip}`;
  }

  return `${scope}:${ip}`;
}

export async function enforceRateLimit(
  request: Request,
  scope: RateLimitScope
): Promise<void> {
  if (!getConfig().features.rateLimitEnabled) return;

  const key = rateLimitKey(request, scope);
  const { max, windowSeconds } = limitsForScope(scope);

  const redis = getRedisClient();
  if (redis) {
    try {
      const redisKey = `ratelimit:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, windowSeconds);
      } else {
        const ttl = await redis.ttl(redisKey);
        if (ttl === -1) {
          await redis.expire(redisKey, windowSeconds);
        }
      }

      if (count > max) {
        throw new AuthError(
          "Too many requests. Please try again later.",
          429,
          "rate_limited"
        );
      }
      return;
    } catch (err) {
      if (err instanceof AuthError) throw err;
      console.error("Redis rate limit failed, falling back to Mongoose:", err);
    }
  }

  await connectDb();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  const existing = await RateLimit.findOne({ key });

  if (!existing || existing.expiresAt < now) {
    await RateLimit.findOneAndUpdate(
      { key },
      { count: 1, expiresAt },
      { upsert: true, new: true }
    );
    return;
  }

  if (existing.count >= max) {
    throw new AuthError(
      "Too many requests. Please try again later.",
      429,
      "rate_limited"
    );
  }

  existing.count += 1;
  await existing.save();
}
