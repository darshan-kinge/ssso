import { createHash, randomBytes } from "crypto";
import { requireAuthSecrets } from "@/lib/auth/secrets";

export function generateClientId(): string {
  return `oa_${randomBytes(16).toString("base64url")}`;
}

export function generateClientSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function hashClientSecret(secret: string): string {
  const { refreshPepper } = requireAuthSecrets();
  return createHash("sha256").update(`client:${secret}:${refreshPepper}`).digest("hex");
}

export function verifyClientSecret(secret: string, hash: string): boolean {
  return hashClientSecret(secret) === hash;
}
