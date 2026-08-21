import { connectDb } from "@/lib/db/mongoose";
import { User, type UserDocument } from "@/lib/models/User";
import { Session } from "@/lib/models/Session";
import { getRefreshCookie } from "@/lib/auth/cookies";
import { hashRefreshToken } from "@/lib/auth/tokens";
import { requireAuthSecrets } from "@/lib/auth/secrets";

export { getOAuthSubjectFromRefreshCookie } from "./subject";

/** Platform refresh cookie → User (SSO on auth domain, personal mode). */
export async function getUserFromRefreshCookie(): Promise<UserDocument | null> {
  const refreshToken = await getRefreshCookie("platform");
  if (!refreshToken) return null;

  await connectDb();
  const { refreshPepper } = requireAuthSecrets();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);

  const session = await Session.findOne({
    refreshTokenHash,
    $or: [{ sessionType: "platform" }, { sessionType: { $exists: false } }],
  });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return User.findById(session.userId);
}
