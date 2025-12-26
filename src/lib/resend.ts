import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function sendEmail(params: SendEmailParams) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "demo@salesagent.runwellsystems.com";

  const { data, error } = await getResend().emails.send({
    from: `Sales Agent Demo <${fromEmail}>`,
    to: [params.to],
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export async function sendMagicLink(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";
  const magicLink = `${appUrl}/api/auth/verify?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Sign in to Sales Agent Demo",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Sign in to Sales Agent Demo</h1>
        <p style="color: #4a4a4a; font-size: 16px;">
          Click the button below to sign in to your account. This link expires in 24 hours.
        </p>
        <a href="${magicLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Sign In
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this email, you can safely ignore it.
        </p>
        <p style="color: #9ca3af; font-size: 12px;">
          Or copy this link: ${magicLink}
        </p>
      </div>
    `,
    text: `Sign in to Sales Agent Demo\n\nClick this link to sign in: ${magicLink}\n\nThis link expires in 24 hours.\n\nIf you didn't request this email, you can safely ignore it.`,
  });
}
