import { getConfig } from "@/lib/config";
import { AuthError } from "./errors";

export function requireAuthSecrets(): {
  jwtSecret: string;
  refreshPepper: string;
} {
  const { jwtSecret, refreshPepper } = getConfig().secrets;

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new AuthError(
      "JWT_SECRET is missing or too short (min 32 characters)",
      503,
      "misconfigured"
    );
  }

  if (!refreshPepper || refreshPepper.length < 32) {
    throw new AuthError(
      "REFRESH_PEPPER is missing or too short (min 32 characters)",
      503,
      "misconfigured"
    );
  }

  return { jwtSecret, refreshPepper };
}
