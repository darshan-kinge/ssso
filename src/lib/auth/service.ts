import { getConfig } from "@/lib/config";
import { connectDb } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { AuthError } from "./errors";
import { assertPasswordPolicy, hashPassword, verifyPassword } from "./password";
import { createSession, toPublicUser } from "./session";
import { isMultiTenantEnabled, isSaasMode } from "@/lib/config/deployment";
import { ensureDefaultWorkspace } from "@/lib/workspace/service";
import { createAndSendVerificationEmail } from "./verification";
import type { LoginInput, SignupInput } from "@/lib/validators/auth";

export async function signupUser(
  input: SignupInput,
  device: string,
  oauthReturn?: string | null
) {
  await connectDb();
  assertPasswordPolicy(input.password);

  const email = input.email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AuthError("Email already registered", 409, "email_exists");
  }

  const requireVerify = getConfig().features.requireEmailVerification;
  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    email,
    passwordHash,
    isVerified: !requireVerify,
  });

  if (requireVerify) {
    await createAndSendVerificationEmail(user, oauthReturn);
    if (isMultiTenantEnabled() && !isSaasMode()) {
      await ensureDefaultWorkspace(user._id.toString(), email);
    }
    return {
      user: toPublicUser(user),
      verificationRequired: true as const,
      message:
        "Account created. Check your email for a verification link before signing in.",
    };
  }

  let accessToken: string;
  if (isMultiTenantEnabled() && !isSaasMode()) {
    const workspace = await ensureDefaultWorkspace(
      user._id.toString(),
      email
    );
    const { getMembership } = await import("@/lib/workspace/service");
    const membership = await getMembership(
      user._id.toString(),
      workspace._id.toString()
    );
    ({ accessToken } = await createSession(user, device, {
      workspaceId: workspace._id.toString(),
      role: membership?.role ?? "owner",
    }));
  } else {
    ({ accessToken } = await createSession(user, device));
  }

  return {
    accessToken,
    user: toPublicUser(user),
    verificationRequired: false as const,
  };
}

export async function loginUser(input: LoginInput, device: string) {
  await connectDb();

  const email = input.email.toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user) {
    throw new AuthError("Invalid email or password", 401, "invalid_credentials");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid email or password", 401, "invalid_credentials");
  }

  if (getConfig().features.requireEmailVerification && !user.isVerified) {
    throw new AuthError(
      "Email verification required. Check your inbox or resend the verification email.",
      403,
      "email_not_verified"
    );
  }

  let accessToken: string;
  if (isMultiTenantEnabled() && !isSaasMode()) {
    const workspace = await ensureDefaultWorkspace(
      user._id.toString(),
      email
    );
    const { getMembership } = await import("@/lib/workspace/service");
    const membership = await getMembership(
      user._id.toString(),
      workspace._id.toString()
    );
    ({ accessToken } = await createSession(user, device, {
      workspaceId: workspace._id.toString(),
      role: membership?.role ?? "owner",
    }));
  } else {
    ({ accessToken } = await createSession(user, device));
  }

  return {
    accessToken,
    user: toPublicUser(user),
  };
}
