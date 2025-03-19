export interface ResetPasswordEmailProps {
  name: string;
  resetUrl: string;
}

export function getResetPasswordEmailTemplate(props: ResetPasswordEmailProps) {
  const { name, resetUrl } = props;

  return {
    subject: "Reset Your Task Manager Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your Task Manager password. Click the button below to create a new password:</p>
        <div style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This password reset link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <p>Best regards,<br>Maravian Web Services</p>
      </div>
    `,
  };
}
