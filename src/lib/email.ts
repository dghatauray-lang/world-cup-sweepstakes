import { Resend } from "resend";

const resend = new Resend(process.env.AUTH_RESEND_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@sweepstakes.internal";
const APP_URL = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

type Team = { name: string };

export async function sendTradeProposedEmail({
  to,
  recipientName,
  proposerName,
  offeredTeams,
  requestedTeams,
  message,
}: {
  to: string;
  recipientName: string;
  proposerName: string;
  offeredTeams: Team[];
  requestedTeams: Team[];
  message: string | null;
}) {
  const offered = offeredTeams.map((t) => t.name).join(", ");
  const requested = requestedTeams.map((t) => t.name).join(", ");

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${proposerName} wants to trade with you`,
    html: `
      <p>Hi ${recipientName},</p>
      <p><strong>${proposerName}</strong> has proposed a trade:</p>
      <ul>
        <li><strong>They offer:</strong> ${offered}</li>
        <li><strong>They want:</strong> ${requested}</li>
        ${message ? `<li><strong>Message:</strong> "${message}"</li>` : ""}
      </ul>
      <p><a href="${APP_URL}/trades">Review the trade →</a></p>
    `,
  });
}

export async function sendTradeRespondedEmail({
  to,
  proposerName,
  recipientName,
  accepted,
  offeredTeams,
  requestedTeams,
}: {
  to: string;
  proposerName: string;
  recipientName: string;
  accepted: boolean;
  offeredTeams: Team[];
  requestedTeams: Team[];
}) {
  const offered = offeredTeams.map((t) => t.name).join(", ");
  const requested = requestedTeams.map((t) => t.name).join(", ");
  const verb = accepted ? "accepted" : "rejected";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${recipientName} ${verb} your trade`,
    html: `
      <p>Hi ${proposerName},</p>
      <p><strong>${recipientName}</strong> has <strong>${verb}</strong> your trade proposal.</p>
      <ul>
        <li><strong>You offered:</strong> ${offered}</li>
        <li><strong>You requested:</strong> ${requested}</li>
      </ul>
      ${accepted ? `<p>The teams have been transferred. <a href="${APP_URL}/dashboard">View your teams →</a></p>` : ""}
    `,
  });
}

export async function sendTradeVetoedEmail({
  to,
  name,
  offeredTeams,
  requestedTeams,
}: {
  to: string;
  name: string;
  offeredTeams: Team[];
  requestedTeams: Team[];
}) {
  const offered = offeredTeams.map((t) => t.name).join(", ");
  const requested = requestedTeams.map((t) => t.name).join(", ");

  await resend.emails.send({
    from: FROM,
    to,
    subject: "A trade involving your teams has been vetoed",
    html: `
      <p>Hi ${name},</p>
      <p>The admin has vetoed a completed trade involving your teams. Ownership has been reversed.</p>
      <ul>
        <li><strong>Teams offered:</strong> ${offered}</li>
        <li><strong>Teams requested:</strong> ${requested}</li>
      </ul>
      <p><a href="${APP_URL}/dashboard">View your teams →</a></p>
    `,
  });
}
