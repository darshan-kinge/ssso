import { headers } from "next/headers";
import { connectDb } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { verifyAccessToken } from "./tokens";
import { AuthError } from "./errors";
import { toPublicUser } from "./session";

export async function getDeviceLabel(): Promise<string> {
  const h = await headers();
  const ua = h.get("user-agent");
  return ua?.slice(0, 200) ?? "unknown";
}

export function getBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

export async function getAuthenticatedUser(authorization: string | null) {
  const token = getBearerToken(authorization);
  if (!token) {
    throw new AuthError("Missing access token", 401, "unauthorized");
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AuthError("Invalid or expired access token", 401, "invalid_token");
  }

  await connectDb();
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AuthError("User not found", 401, "user_not_found");
  }

  return { user, accessToken: token, publicUser: toPublicUser(user) };
}
