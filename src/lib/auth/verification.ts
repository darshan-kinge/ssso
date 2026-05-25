import { getConfig } from "@/lib/config";
import { connectDb } from "@/lib/db/mongoose";
import { User, type UserDocument } from "@/lib/models/User";
import { VerificationToken } from "@/lib/models/VerificationToken";
import { sendEmail } from "@/lib/email/send";
import { verificationEmailContent } from "@/lib/email/templates";
import { AuthError } from "./errors";
import { generateOpaqueToken, hashOpaqueToken } from "./opaque-token";

function verificationExpiresAt(): Date {
  const hours = getConfig().email.verificationTokenTtlHours;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export async function createAndSendVerificationEmail(
  user: UserDocument
): Promise<void> {
  await connectDb();

  const token = generateOpaqueToken();
  const tokenHash = hashOpaqueToken(token);

  await VerificationToken.deleteMany({ userId: user._id, usedAt: null });
  await VerificationToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: verificationExpiresAt(),
  });

  const mail = verificationEmailContent(token);
  await sendEmail({
    to: user.email,
    ...mail,
  });
}

export async function verifyEmailWithToken(token: string): Promise<UserDocument> {
  await connectDb();
  const tokenHash = hashOpaqueToken(token);

  const record = await VerificationToken.findOne({ tokenHash });
  if (!record || record.usedAt) {
    throw new AuthError("Invalid or expired verification link", 400, "invalid_token");
  }

  if (record.expiresAt < new Date()) {
    await VerificationToken.deleteOne({ _id: record._id });
    throw new AuthError("Verification link expired", 400, "token_expired");
  }

  const user = await User.findById(record.userId);
  if (!user) {
    throw new AuthError("User not found", 404, "user_not_found");
  }

  user.isVerified = true;
  await user.save();

  record.usedAt = new Date();
  await record.save();

  return user;
}

export async function resendVerificationEmail(email: string): Promise<void> {
  await connectDb();
  const normalized = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalized });

  if (!user || user.isVerified) {
    return;
  }

  await createAndSendVerificationEmail(user);
}
