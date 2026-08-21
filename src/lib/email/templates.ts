import { getConfig } from "@/lib/config";
import { getPlatformBaseUrl } from "@/lib/config/deployment";
import { buildAuthLink } from "./send";

function layout(title: string, body: string): string {
  const { app } = getConfig();
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;background:#09090b;font-family:system-ui,sans-serif;color:#fafafa;padding:32px">
  <div style="max-width:480px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:32px">
    <p style="margin:0 0 8px;font-size:12px;color:#3b82f6;font-weight:600">${app.name}</p>
    <h1 style="margin:0 0 16px;font-size:20px">${title}</h1>
    ${body}
    <p style="margin:24px 0 0;font-size:12px;color:#71717a">If you did not request this, ignore this email.</p>
  </div>
</body>
</html>`;
}

export function verificationEmailContent(
  token: string,
  options?: { authBase?: string; workspaceName?: string }
) {
  const { app } = getConfig();
  const base = (options?.authBase ?? getConfig().urls.authBase).replace(
    /\/$/,
    ""
  );
  const link = `${base}/verify-email?token=${encodeURIComponent(token)}`;
  const hours = getConfig().email.verificationTokenTtlHours;
  const label = options?.workspaceName ?? app.name;

  const html = layout(
    "Verify your email",
    `
    <p style="color:#a1a1aa;line-height:1.5">Confirm your email for <strong>${label}</strong>.</p>
    <p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500">Verify email</a></p>
    <p style="font-size:12px;color:#71717a;word-break:break-all">${link}</p>
    <p style="font-size:12px;color:#71717a">Expires in ${hours} hours.</p>
    `
  );

  const text = `Verify your email for ${label}:\n\n${link}\n\nExpires in ${hours} hours.`;

  return {
    subject: `Verify your ${label} email`,
    html,
    text,
  };
}

export function passwordResetEmailContent(token: string) {
  const { app } = getConfig();
  const link = buildAuthLink("/reset-password", token);
  const hours = getConfig().email.passwordResetTokenTtlHours;

  const html = layout(
    "Reset your password",
    `
    <p style="color:#a1a1aa;line-height:1.5">Reset your password for <strong>${app.name}</strong>.</p>
    <p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500">Reset password</a></p>
    <p style="font-size:12px;color:#71717a;word-break:break-all">${link}</p>
    <p style="font-size:12px;color:#71717a">Expires in ${hours} hour(s).</p>
    `
  );

  const text = `Reset your password for ${app.name}:\n\n${link}\n\nExpires in ${hours} hour(s).`;

  return {
    subject: `Reset your ${app.name} password`,
    html,
    text,
  };
}

export function inviteEmailContent(input: {
  token: string;
  workspaceName: string;
  role: string;
  inviterEmail?: string;
}) {
  const { app } = getConfig();
  const base = getPlatformBaseUrl().replace(/\/$/, "");
  const link = `${base}/invite/accept?token=${encodeURIComponent(input.token)}`;
  const hours = getConfig().email.inviteTokenTtlHours;
  const inviter = input.inviterEmail
    ? `<p style="color:#a1a1aa;line-height:1.5">${input.inviterEmail} invited you to join <strong>${input.workspaceName}</strong> as <strong>${input.role}</strong>.</p>`
    : `<p style="color:#a1a1aa;line-height:1.5">You are invited to join <strong>${input.workspaceName}</strong> as <strong>${input.role}</strong>.</p>`;

  const html = layout(
    "Workspace invitation",
    `
    ${inviter}
    <p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500">Accept invitation</a></p>
    <p style="font-size:12px;color:#71717a;word-break:break-all">${link}</p>
    <p style="font-size:12px;color:#71717a">Expires in ${hours} hours. Sign in with the invited email address.</p>
    `
  );

  const text = `Join ${input.workspaceName} on ${app.name} as ${input.role}:\n\n${link}\n\nExpires in ${hours} hours.`;

  return {
    subject: `Invitation to ${input.workspaceName} on ${app.name}`,
    html,
    text,
  };
}
