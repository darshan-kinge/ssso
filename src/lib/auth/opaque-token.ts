import { createHash, randomBytes } from "crypto";
import { requireAuthSecrets } from "./secrets";

export function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  const { refreshPepper } = requireAuthSecrets();
  return createHash("sha256")
    .update(`opaque:${token}:${refreshPepper}`)
    .digest("hex");
}
