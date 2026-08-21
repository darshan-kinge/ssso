import { connectDb } from "@/lib/db/mongoose";
import { Session } from "@/lib/models/Session";
import type { EndUserDocument } from "@/lib/models/EndUser";
import { signAccessToken } from "@/lib/auth/tokens";
import { generateRefreshToken, refreshTokenExpiresAt } from "@/lib/auth/tokens";
import { setRefreshCookie } from "@/lib/auth/cookies";

export function toPublicEndUser(user: EndUserDocument) {
  const doc = user as EndUserDocument & { createdAt?: Date };
  return {
    id: user._id.toString(),
    email: user.email,
    isVerified: user.isVerified,
    workspaceId: user.workspaceId.toString(),
    createdAt: doc.createdAt?.toISOString(),
  };
}

export async function createEndUserSession(
  user: EndUserDocument,
  device: string
): Promise<{ accessToken: string }> {
  await connectDb();
  const { hashRefreshToken } = await import("@/lib/auth/tokens");
  const { requireAuthSecrets } = await import("@/lib/auth/secrets");
  const { refreshPepper } = requireAuthSecrets();

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken, refreshPepper);
  const expiresAt = refreshTokenExpiresAt();

  await Session.create({
    sessionType: "end_user",
    userId: user._id,
    workspaceId: user.workspaceId,
    refreshTokenHash,
    device,
    expiresAt,
  });

  await setRefreshCookie(refreshToken, expiresAt, "end_user");

  const accessToken = signAccessToken(user._id.toString(), user.email, {
    type: "end_user",
    workspaceId: user.workspaceId.toString(),
    clientId: undefined,
  });

  return { accessToken };
}
