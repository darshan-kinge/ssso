import { connectDb } from "@/lib/db/mongoose";
import { Session, type SessionDocument } from "@/lib/models/Session";
import { getRefreshCookie, clearRefreshCookie } from "./cookies";
import { hashRefreshToken } from "./tokens";
import { requireAuthSecrets } from "./secrets";
import { AuthError } from "./errors";

export function toPublicSession(
  session: SessionDocument,
  currentSessionId: string | null
) {
  const doc = session as SessionDocument & { createdAt?: Date };
  return {
    id: session._id.toString(),
    device: session.device,
    createdAt: doc.createdAt?.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    isCurrent: currentSessionId === session._id.toString(),
  };
}

export async function getCurrentSessionId(): Promise<string | null> {
  const refreshToken = await getRefreshCookie();
  if (!refreshToken) return null;

  await connectDb();
  const { refreshPepper } = requireAuthSecrets();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);
  const session = await Session.findOne({ refreshTokenHash });
  return session?._id.toString() ?? null;
}

export async function listSessionsForUser(userId: string) {
  await connectDb();
  const currentSessionId = await getCurrentSessionId();
  const sessions = await Session.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50);

  return {
    sessions: sessions.map((s) => toPublicSession(s, currentSessionId)),
    currentSessionId,
  };
}

export async function revokeSessionForUser(
  userId: string,
  sessionId: string
): Promise<{ revokedCurrent: boolean }> {
  await connectDb();
  const session = await Session.findOne({ _id: sessionId, userId });

  if (!session) {
    throw new AuthError("Session not found", 404, "not_found");
  }

  const currentSessionId = await getCurrentSessionId();
  const isCurrent = currentSessionId === sessionId;

  await Session.deleteOne({ _id: session._id });

  if (isCurrent) {
    await clearRefreshCookie();
  }

  return { revokedCurrent: isCurrent };
}

export async function revokeOtherSessionsForUser(userId: string): Promise<number> {
  await connectDb();
  const currentSessionId = await getCurrentSessionId();

  const filter: Record<string, unknown> = { userId };
  if (currentSessionId) {
    filter._id = { $ne: currentSessionId };
  }

  const result = await Session.deleteMany(filter);
  return result.deletedCount ?? 0;
}

export async function revokeAllSessionsForUser(userId: string): Promise<number> {
  await connectDb();
  const result = await Session.deleteMany({ userId });
  await clearRefreshCookie();
  return result.deletedCount ?? 0;
}
