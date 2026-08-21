import { connectDb } from "@/lib/db/mongoose";
import { User, type UserDocument } from "@/lib/models/User";
import { EndUser, type EndUserDocument } from "@/lib/models/EndUser";
import { Session } from "@/lib/models/Session";
import { getRefreshCookie } from "@/lib/auth/cookies";
import { hashRefreshToken } from "@/lib/auth/tokens";
import { requireAuthSecrets } from "@/lib/auth/secrets";
import { isMultiTenantEnabled } from "@/lib/config/deployment";

export type OAuthSubject =
  | { kind: "platform"; user: UserDocument }
  | { kind: "end_user"; user: EndUserDocument };

export async function getOAuthSubjectFromRefreshCookie(
  expectedWorkspaceId?: string
): Promise<OAuthSubject | null> {
  if (!isMultiTenantEnabled()) {
    const user = await getPlatformUserFromRefreshCookie();
    return user ? { kind: "platform", user } : null;
  }

  const refreshToken = await getRefreshCookie("end_user");
  if (!refreshToken) return null;

  await connectDb();
  const { refreshPepper } = requireAuthSecrets();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);

  const session = await Session.findOne({
    refreshTokenHash,
    sessionType: "end_user",
  });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const user = await EndUser.findById(session.userId);
  if (!user) return null;

  if (
    expectedWorkspaceId &&
    user.workspaceId.toString() !== expectedWorkspaceId
  ) {
    return null;
  }

  return { kind: "end_user", user };
}

async function getPlatformUserFromRefreshCookie(): Promise<UserDocument | null> {
  const refreshToken = await getRefreshCookie("platform");
  if (!refreshToken) return null;

  await connectDb();
  const { refreshPepper } = requireAuthSecrets();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);

  const session = await Session.findOne({
    refreshTokenHash,
    sessionType: { $in: ["platform", undefined] },
  });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return User.findById(session.userId);
}

export function subjectEmail(subject: OAuthSubject): string {
  return subject.user.email;
}

export function subjectId(subject: OAuthSubject): string {
  return subject.user._id.toString();
}
