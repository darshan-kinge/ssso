import { connectDb } from "@/lib/db/mongoose";
import { Session } from "@/lib/models/Session";
import type { UserDocument } from "@/lib/models/User";
import { AuthError } from "./errors";
import { requireAuthSecrets } from "./secrets";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
} from "./tokens";
import { setRefreshCookie } from "./cookies";

export function toPublicUser(user: UserDocument) {
  const doc = user as UserDocument & { createdAt?: Date };
  return {
    id: user._id.toString(),
    email: user.email,
    isVerified: user.isVerified,
    createdAt: doc.createdAt?.toISOString(),
  };
}

export async function createSession(
  user: UserDocument,
  device: string
): Promise<{ accessToken: string }> {
  await connectDb();
  const { refreshPepper } = requireAuthSecrets();

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);
  const expiresAt = refreshTokenExpiresAt();

  await Session.create({
    userId: user._id,
    refreshTokenHash,
    device,
    expiresAt,
  });

  await setRefreshCookie(refreshToken, expiresAt);

  const { signAccessToken } = await import("./tokens");
  const accessToken = signAccessToken(user._id.toString(), user.email);

  return { accessToken };
}

export async function revokeSessionByRefreshToken(
  refreshToken: string
): Promise<void> {
  await connectDb();
  const { refreshPepper } = requireAuthSecrets();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);
  await Session.deleteOne({ refreshTokenHash });
}

export async function rotateSession(refreshToken: string): Promise<{
  accessToken: string;
  user: ReturnType<typeof toPublicUser>;
}> {
  await connectDb();
  const { refreshPepper } = requireAuthSecrets();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);

  const session = await Session.findOne({ refreshTokenHash });
  if (!session) {
    throw new AuthError("Invalid or expired session", 401, "invalid_session");
  }

  if (session.expiresAt < new Date()) {
    await Session.deleteOne({ _id: session._id });
    throw new AuthError("Session expired", 401, "session_expired");
  }

  const { User } = await import("@/lib/models/User");
  const user = await User.findById(session.userId);
  if (!user) {
    await Session.deleteOne({ _id: session._id });
    throw new AuthError("User not found", 401, "user_not_found");
  }

  await Session.deleteOne({ _id: session._id });

  const { accessToken } = await createSession(user, session.device);
  return { accessToken, user: toPublicUser(user) };
}
