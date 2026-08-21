import { getConfig, isEmailConfigured } from "@/lib/config";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const config = getConfig();

  if (!isEmailConfigured()) {
    console.info("[SSSO email — dev console]");
    console.info(`To: ${input.to}`);
    console.info(`Subject: ${input.subject}`);
    console.info(input.text);
    console.info("---");
    return;
  }

  const { resendApiKey, emailFrom } = config.secrets;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    throw new Error("Failed to send email");
  }
}

export function buildAuthLink(path: string, token: string): string {
  const base = getConfig().urls.authBase.replace(/\/$/, "");
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}
