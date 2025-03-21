import { env } from "@/lib/env";

export interface TeamInviteEmailProps {
  invitedUserName: string;
  teamName: string;
  invitedByName: string;
  inviteUrl: string;
}

export function getTeamInviteEmailTemplate(props: TeamInviteEmailProps) {
  const { invitedUserName, teamName, invitedByName, inviteUrl } = props;
  const appName = env.NEXT_PUBLIC_NAME;

  return {
    subject: `You're invited to join ${teamName} on ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Team Invitation</h1>
        <p>Hi ${invitedUserName},</p>
        <p>${invitedByName} has invited you to join the team "${teamName}" on ${appName}.</p>
        <p>Click the button below to accept the invitation and join the team:</p>
        <div style="margin: 20px 0;">
          <a href="${inviteUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Join Team
          </a>
        </div>
        <p>This invitation link will expire in 7 days.</p>
        <p>If you don't want to join or received this email by mistake, you can safely ignore it.</p>
        <p>Best regards,<br>Maravian Web Services</p>
      </div>
    `,
  };
}
