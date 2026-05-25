import { getConfig } from "@/lib/config";
import { connectDb } from "@/lib/db/mongoose";
import { RateLimit } from "@/lib/models/RateLimit";
import { AuthError } from "@/lib/auth/errors";
import { getClientIp } from "./client-ip";

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

export async function enforceRateLimit(
  request: Request,
  scope: RateLimitScope
): Promise<void> {
  if (!getConfig().features.rateLimitEnabled) return;

  await connectDb();

  const ip = getClientIp(request);
  const { max, windowSeconds } = limitsForScope(scope);
  const key = `${scope}:${ip}`;
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
