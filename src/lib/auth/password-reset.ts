import { getConfig } from "@/lib/config";
import { connectDb } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { PasswordResetToken } from "@/lib/models/PasswordResetToken";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmailContent } from "@/lib/email/templates";
import { AuthError } from "./errors";
import { assertPasswordPolicy, hashPassword } from "./password";
import { generateOpaqueToken, hashOpaqueToken } from "./opaque-token";

function resetExpiresAt(): Date {
  const hours = getConfig().email.passwordResetTokenTtlHours;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/** Always resolves — avoids email enumeration */
export async function requestPasswordReset(email: string): Promise<void> {
  await connectDb();
  const normalized = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalized });

  if (!user) {
    return;
  }

  const token = generateOpaqueToken();
  const tokenHash = hashOpaqueToken(token);

  await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: resetExpiresAt(),
  });

  const mail = passwordResetEmailContent(token);
  await sendEmail({
    to: user.email,
    ...mail,
  });
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<void> {
  await connectDb();
  assertPasswordPolicy(newPassword);

  const tokenHash = hashOpaqueToken(token);
  const record = await PasswordResetToken.findOne({ tokenHash });

  if (!record || record.usedAt) {
    throw new AuthError("Invalid or expired reset link", 400, "invalid_token");
  }

  if (record.expiresAt < new Date()) {
    await PasswordResetToken.deleteOne({ _id: record._id });
    throw new AuthError("Reset link expired", 400, "token_expired");
  }

  const user = await User.findById(record.userId);
  if (!user) {
    throw new AuthError("User not found", 404, "user_not_found");
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  record.usedAt = new Date();
  await record.save();

  await PasswordResetToken.deleteMany({
    userId: user._id,
    _id: { $ne: record._id },
  });
}
