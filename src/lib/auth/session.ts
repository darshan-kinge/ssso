import { connectDb } from "@/lib/db/mongoose";
import { Session } from "@/lib/models/Session";
import { User } from "@/lib/models/User";
import { EndUser } from "@/lib/models/EndUser";
import type { UserDocument } from "@/lib/models/User";
import { AuthError } from "./errors";
import { requireAuthSecrets } from "./secrets";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
  signAccessToken,
} from "./tokens";
import { setRefreshCookie, getRefreshCookie } from "./cookies";
import { toPublicEndUser } from "@/lib/end-user/session";
import type { MembershipRole } from "@/lib/models/Membership";

export function toPublicUser(user: UserDocument) {
  const doc = user as UserDocument & { createdAt?: Date };
  return {
    id: user._id.toString(),
    email: user.email,
    isVerified: user.isVerified,
    createdAt: doc.createdAt?.toISOString(),
  };
}

export interface PlatformSessionContext {
  workspaceId: string;
  role: MembershipRole;
}

export async function createSession(
  user: UserDocument,
  device: string,
  ctx?: PlatformSessionContext
): Promise<{ accessToken: string }> {
  await connectDb();
  const { refreshPepper } = requireAuthSecrets();

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);
  const expiresAt = refreshTokenExpiresAt();

  await Session.create({
    sessionType: "platform",
    userId: user._id,
    workspaceId: ctx?.workspaceId ?? null,
    refreshTokenHash,
    device,
    expiresAt,
  });

  await setRefreshCookie(refreshToken, expiresAt, "platform");

  const accessToken = signAccessToken(user._id.toString(), user.email, {
    type: "platform",
    workspaceId: ctx?.workspaceId,
    role: ctx?.role,
  });

  return { accessToken };
}

export async function revokeSessionByRefreshToken(
  refreshToken: string,
  sessionType: "platform" | "end_user" = "platform"
): Promise<void> {
  await connectDb();
  const { refreshPepper } = requireAuthSecrets();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);
  await Session.deleteOne({ refreshTokenHash, sessionType });
}

export async function rotateSession(refreshToken: string): Promise<{
  accessToken: string;
  user: ReturnType<typeof toPublicUser>;
}> {
  await connectDb();
  const { refreshPepper } = requireAuthSecrets();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);

  // 1. Check if this token hash was already consumed (reuse detection)
  const reusedSession = await Session.findOne({
    usedTokenHashes: refreshTokenHash,
  });
  if (reusedSession) {
    // Revoke all sessions for this user to contain the compromise
    await Session.deleteMany({ userId: reusedSession.userId });
    throw new AuthError("Security alert: Session hijacked or reuse detected. Access revoked.", 401, "invalid_session");
  }

  const session = await Session.findOne({
    refreshTokenHash,
    sessionType: "platform",
  });
  if (!session) {
    throw new AuthError("Invalid or expired session", 401, "invalid_session");
  }

  if (session.expiresAt < new Date()) {
    await Session.deleteOne({ _id: session._id });
    throw new AuthError("Session expired", 401, "session_expired");
  }

  const user = await User.findById(session.userId);
  if (!user) {
    await Session.deleteOne({ _id: session._id });
    throw new AuthError("User not found", 401, "user_not_found");
  }

  // Rotate in-place on the same session document
  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = hashRefreshToken(newRefreshToken, refreshPepper);
  const newExpiresAt = refreshTokenExpiresAt();

  const usedList = session.usedTokenHashes || [];
  session.usedTokenHashes = [...usedList, refreshTokenHash];
  session.refreshTokenHash = newRefreshTokenHash;
  session.expiresAt = newExpiresAt;
  await session.save();

  await setRefreshCookie(newRefreshToken, newExpiresAt, "platform");

  const workspaceId = session.workspaceId?.toString();
  const { getMembership } = await import("@/lib/workspace/service");
  let role: MembershipRole | undefined;
  if (workspaceId) {
    const m = await getMembership(user._id.toString(), workspaceId);
    role = m?.role;
  }

  const accessToken = signAccessToken(user._id.toString(), user.email, {
    type: "platform",
    workspaceId,
    role,
  });

  return { accessToken, user: toPublicUser(user) };
}

export async function rotateEndUserSession(refreshToken: string) {
  await connectDb();
  const { refreshPepper } = requireAuthSecrets();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);

  // 1. Check if this token hash was already consumed (reuse detection)
  const reusedSession = await Session.findOne({
    usedTokenHashes: refreshTokenHash,
  });
  if (reusedSession) {
    // Revoke all sessions for this user to contain the compromise
    await Session.deleteMany({ userId: reusedSession.userId });
    throw new AuthError("Security alert: Session hijacked or reuse detected. Access revoked.", 401, "invalid_session");
  }

  const session = await Session.findOne({
    refreshTokenHash,
    sessionType: "end_user",
  });
  if (!session) {
    throw new AuthError("Invalid or expired session", 401, "invalid_session");
  }

  if (session.expiresAt < new Date()) {
    await Session.deleteOne({ _id: session._id });
    throw new AuthError("Session expired", 401, "session_expired");
  }

  const user = await EndUser.findById(session.userId);
  if (!user) {
    await Session.deleteOne({ _id: session._id });
    throw new AuthError("User not found", 401, "user_not_found");
  }

  // Rotate in-place on the same session document
  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = hashRefreshToken(newRefreshToken, refreshPepper);
  const newExpiresAt = refreshTokenExpiresAt();

  const usedList = session.usedTokenHashes || [];
  session.usedTokenHashes = [...usedList, refreshTokenHash];
  session.refreshTokenHash = newRefreshTokenHash;
  session.expiresAt = newExpiresAt;
  await session.save();

  await setRefreshCookie(newRefreshToken, newExpiresAt, "end_user");

  const accessToken = signAccessToken(user._id.toString(), user.email, {
    type: "end_user",
    workspaceId: session.workspaceId?.toString(),
  });

  return { accessToken, user: toPublicEndUser(user) };
}

/** Platform refresh cookie rotation */
export async function rotateSessionFromCookie(): Promise<{
  accessToken: string;
  user: ReturnType<typeof toPublicUser>;
} | null> {
  const token = await getRefreshCookie("platform");
  if (!token) return null;
  return rotateSession(token);
}
