import { getConfig } from "@/lib/config";
import { connectDb } from "@/lib/db/mongoose";
import { EndUser } from "@/lib/models/EndUser";
import type { WorkspaceDocument } from "@/lib/models/Workspace";
import { AuthError } from "@/lib/auth/errors";
import {
  assertPasswordPolicy,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import { createEndUserSession, toPublicEndUser } from "./session";
import { createAndSendEndUserVerificationEmail } from "./verification";
import type { LoginInput, SignupInput } from "@/lib/validators/auth";

export async function signupEndUser(
  workspace: WorkspaceDocument,
  input: SignupInput,
  device: string,
  oauthReturn?: string | null
) {
  await connectDb();
  assertPasswordPolicy(input.password);

  const email = input.email.toLowerCase().trim();
  const existing = await EndUser.findOne({
    workspaceId: workspace._id,
    email,
  });
  if (existing) {
    throw new AuthError("Email already registered", 409, "email_exists");
  }

  const requireVerify = getConfig().features.requireEmailVerification;
  const passwordHash = await hashPassword(input.password);
  const user = await EndUser.create({
    workspaceId: workspace._id,
    email,
    passwordHash,
    isVerified: !requireVerify,
  });

  if (requireVerify) {
    await createAndSendEndUserVerificationEmail(user, workspace, oauthReturn);
    return {
      user: toPublicEndUser(user),
      verificationRequired: true as const,
      message:
        "Account created. Check your email for a verification link before signing in.",
    };
  }

  const { accessToken } = await createEndUserSession(user, device);
  return {
    accessToken,
    user: toPublicEndUser(user),
    verificationRequired: false as const,
  };
}

export async function loginEndUser(
  workspace: WorkspaceDocument,
  input: LoginInput,
  device: string
) {
  await connectDb();

  const email = input.email.toLowerCase().trim();
  const user = await EndUser.findOne({
    workspaceId: workspace._id,
    email,
  });
  if (!user) {
    throw new AuthError("Invalid email or password", 401, "invalid_credentials");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid email or password", 401, "invalid_credentials");
  }

  if (getConfig().features.requireEmailVerification && !user.isVerified) {
    throw new AuthError(
      "Email verification required",
      403,
      "email_not_verified"
    );
  }

  const { accessToken } = await createEndUserSession(user, device);
  return { accessToken, user: toPublicEndUser(user) };
}
