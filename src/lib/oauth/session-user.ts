import { connectDb } from "@/lib/db/mongoose";
import { User, type UserDocument } from "@/lib/models/User";
import { Session } from "@/lib/models/Session";
import { getRefreshCookie } from "@/lib/auth/cookies";
import { hashRefreshToken } from "@/lib/auth/tokens";
import { requireAuthSecrets } from "@/lib/auth/secrets";

/** Resolve user from auth-domain refresh cookie (SSO silent login). */
export async function getUserFromRefreshCookie(): Promise<UserDocument | null> {
  const refreshToken = await getRefreshCookie();
  if (!refreshToken) return null;

  await connectDb();
  const { refreshPepper } = requireAuthSecrets();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);

  const session = await Session.findOne({ refreshTokenHash });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const user = await User.findById(session.userId);
  return user;
}
