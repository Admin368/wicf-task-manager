import { env } from "@/lib/env";

export interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export function getWelcomeEmailTemplate(props: WelcomeEmailProps) {
  const { name, loginUrl } = props;
  const appName = env.NEXT_PUBLIC_NAME;

  return {
    subject: `Welcome to ${appName}, ${name}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to ${appName}!</h1>
        <p>Hi ${name},</p>
        <p>We're excited to have you on board! ${appName} is your new home for organizing and managing tasks efficiently.</p>
        <p>Get started by logging in to your account:</p>
        <div style="margin: 20px 0;">
          <a href="${loginUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Login to Your Account
          </a>
        </div>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>Maravian Web Services</p>
      </div>
    `,
  };
}
