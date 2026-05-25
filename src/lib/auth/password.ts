import bcrypt from "bcryptjs";
import { getConfig } from "@/lib/config";
import { AuthError } from "./errors";

export async function hashPassword(password: string): Promise<string> {
  const { bcryptRounds } = getConfig().security;
  return bcrypt.hash(password, bcryptRounds);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function assertPasswordPolicy(password: string): void {
  const { minPasswordLength } = getConfig().security;
  if (password.length < minPasswordLength) {
    throw new AuthError(
      `Password must be at least ${minPasswordLength} characters`,
      400,
      "weak_password"
    );
  }
}
