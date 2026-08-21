import { getConfig } from "@/lib/config";
import { tenantAuthUrl } from "@/lib/config/deployment";
import { connectDb } from "@/lib/db/mongoose";
import { EndUser, type EndUserDocument } from "@/lib/models/EndUser";
import type { WorkspaceDocument } from "@/lib/models/Workspace";
import { VerificationToken } from "@/lib/models/VerificationToken";
import { sendEmail } from "@/lib/email/send";
import { verificationEmailContent } from "@/lib/email/templates";
import { AuthError } from "@/lib/auth/errors";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/auth/opaque-token";

function verificationExpiresAt(): Date {
  const hours = getConfig().email.verificationTokenTtlHours;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export async function createAndSendEndUserVerificationEmail(
  user: EndUserDocument,
  workspace: WorkspaceDocument,
  oauthReturn?: string | null
): Promise<void> {
  await connectDb();

  const token = generateOpaqueToken();
  const tokenHash = hashOpaqueToken(token);

  await VerificationToken.deleteMany({
    endUserId: user._id,
    workspaceId: workspace._id,
    usedAt: null,
  });

  await VerificationToken.create({
    endUserId: user._id,
    workspaceId: workspace._id,
    tokenHash,
    expiresAt: verificationExpiresAt(),
    oauthReturn: oauthReturn ?? null,
  });

  const authBase = tenantAuthUrl(workspace.slug);
  const mail = verificationEmailContent(token, {
    authBase,
    workspaceName: workspace.name,
  });

  await sendEmail({
    to: user.email,
    ...mail,
  });
}

export async function verifyEndUserEmailWithToken(
  token: string,
  workspaceId: string
): Promise<{ user: EndUserDocument; oauthReturn: string | null }> {
  await connectDb();
  const tokenHash = hashOpaqueToken(token);

  const record = await VerificationToken.findOne({
    tokenHash,
    workspaceId,
    endUserId: { $ne: null },
  });

  if (!record || record.usedAt) {
    throw new AuthError("Invalid or expired verification link", 400, "invalid_token");
  }

  if (record.expiresAt < new Date()) {
    await VerificationToken.deleteOne({ _id: record._id });
    throw new AuthError("Verification link expired", 400, "token_expired");
  }

  const user = await EndUser.findOne({
    _id: record.endUserId,
    workspaceId,
  });

  if (!user) {
    throw new AuthError("User not found", 404, "user_not_found");
  }

  user.isVerified = true;
  await user.save();

  record.usedAt = new Date();
  await record.save();

  return { user, oauthReturn: record.oauthReturn || null };
}

export async function resendEndUserVerificationEmail(
  email: string,
  workspace: WorkspaceDocument,
  oauthReturn?: string | null
): Promise<void> {
  await connectDb();
  const normalized = email.toLowerCase().trim();
  const user = await EndUser.findOne({
    workspaceId: workspace._id,
    email: normalized,
  });

  if (!user || user.isVerified) {
    return;
  }

  await createAndSendEndUserVerificationEmail(user, workspace, oauthReturn);
}
