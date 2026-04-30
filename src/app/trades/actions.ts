"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  sendTradeProposedEmail,
  sendTradeRespondedEmail,
  sendTradeVetoedEmail,
} from "@/lib/email";

async function getSession() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}

async function assertAdmin() {
  const session = await getSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export async function proposeTradeAction(
  recipientId: string,
  offeredTeamIds: string[],
  requestedTeamIds: string[],
  message: string
): Promise<{ error?: string }> {
  const session = await getSession();
  const proposerId = session.user.id;

  if (proposerId === recipientId) return { error: "You can't trade with yourself." };
  if (offeredTeamIds.length === 0) return { error: "Select at least one team to offer." };
  if (requestedTeamIds.length === 0) return { error: "Select at least one team to request." };

  // Verify the proposer actually owns the offered teams
  const owned = await prisma.userTeam.findMany({
    where: { userId: proposerId, teamId: { in: offeredTeamIds } },
  });
  if (owned.length !== offeredTeamIds.length) return { error: "You don't own all the offered teams." };

  // Verify the recipient owns the requested teams
  const recipOwned = await prisma.userTeam.findMany({
    where: { userId: recipientId, teamId: { in: requestedTeamIds } },
  });
  if (recipOwned.length !== requestedTeamIds.length) return { error: "The other user doesn't own all the requested teams." };

  const [recipient, offeredTeams, requestedTeams] = await Promise.all([
    prisma.user.findUnique({ where: { id: recipientId }, select: { email: true, name: true } }),
    prisma.team.findMany({ where: { id: { in: offeredTeamIds } }, select: { name: true } }),
    prisma.team.findMany({ where: { id: { in: requestedTeamIds } }, select: { name: true } }),
  ]);

  await Promise.all([
    prisma.trade.create({
      data: {
        proposerId,
        recipientId,
        message: message.trim() || null,
        items: {
          create: [
            ...offeredTeamIds.map((teamId) => ({ teamId, direction: "OFFERED" as const })),
            ...requestedTeamIds.map((teamId) => ({ teamId, direction: "REQUESTED" as const })),
          ],
        },
      },
    }),
    prisma.user.update({ where: { id: recipientId }, data: { hasNotification: true } }),
  ]);

  // Fire-and-forget email — don't block the response
  if (recipient) {
    sendTradeProposedEmail({
      to: recipient.email,
      recipientName: recipient.name ?? recipient.email,
      proposerName: session.user.name ?? session.user.email ?? "Someone",
      offeredTeams,
      requestedTeams,
      message: message.trim() || null,
    }).catch(() => {});
  }

  revalidatePath("/trades");
  return {};
}

export async function respondToTradeAction(
  tradeId: string,
  accept: boolean
): Promise<{ error?: string }> {
  const session = await getSession();

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: { items: true },
  });

  if (!trade) return { error: "Trade not found." };
  if (trade.recipientId !== session.user.id) return { error: "Not your trade to respond to." };
  if (trade.status !== "PENDING") return { error: "This trade is no longer pending." };

  const offeredIds   = trade.items.filter((i) => i.direction === "OFFERED").map((i) => i.teamId);
  const requestedIds = trade.items.filter((i) => i.direction === "REQUESTED").map((i) => i.teamId);

  const [proposer, offeredTeams, requestedTeams] = await Promise.all([
    prisma.user.findUnique({ where: { id: trade.proposerId }, select: { email: true, name: true } }),
    prisma.team.findMany({ where: { id: { in: offeredIds } }, select: { name: true } }),
    prisma.team.findMany({ where: { id: { in: requestedIds } }, select: { name: true } }),
  ]);

  if (!accept) {
    await Promise.all([
      prisma.trade.update({ where: { id: tradeId }, data: { status: "REJECTED" } }),
      prisma.user.update({ where: { id: trade.proposerId }, data: { hasNotification: true } }),
    ]);
    if (proposer) {
      sendTradeRespondedEmail({
        to: proposer.email,
        proposerName: proposer.name ?? proposer.email,
        recipientName: session.user.name ?? session.user.email ?? "The recipient",
        accepted: false,
        offeredTeams,
        requestedTeams,
      }).catch(() => {});
    }
    revalidatePath("/trades");
    return {};
  }

  // Accept: atomically transfer teams
  const [offeredUTs, requestedUTs] = await Promise.all([
    prisma.userTeam.findMany({ where: { userId: trade.proposerId,  teamId: { in: offeredIds } } }),
    prisma.userTeam.findMany({ where: { userId: trade.recipientId, teamId: { in: requestedIds } } }),
  ]);

  if (offeredUTs.length !== offeredIds.length)   return { error: "Proposer no longer owns all offered teams." };
  if (requestedUTs.length !== requestedIds.length) return { error: "You no longer own all requested teams." };

  await prisma.$transaction([
    // Offered teams: proposer → recipient
    ...offeredUTs.map((ut) =>
      prisma.userTeam.update({ where: { id: ut.id }, data: { userId: trade.recipientId } })
    ),
    // Requested teams: recipient → proposer
    ...requestedUTs.map((ut) =>
      prisma.userTeam.update({ where: { id: ut.id }, data: { userId: trade.proposerId } })
    ),
    prisma.trade.update({ where: { id: tradeId }, data: { status: "ACCEPTED" } }),
    prisma.user.update({ where: { id: trade.proposerId }, data: { hasNotification: true } }),
  ]);

  if (proposer) {
    sendTradeRespondedEmail({
      to: proposer.email,
      proposerName: proposer.name ?? proposer.email,
      recipientName: session.user.name ?? session.user.email ?? "The recipient",
      accepted: true,
      offeredTeams,
      requestedTeams,
    }).catch(() => {});
  }

  revalidatePath("/trades");
  revalidatePath("/dashboard");
  return {};
}

export async function vetoTradeAction(tradeId: string): Promise<{ error?: string }> {
  await assertAdmin();

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: {
      items: true,
      proposer:  { select: { email: true, name: true } },
      recipient: { select: { email: true, name: true } },
    },
  });

  if (!trade) return { error: "Trade not found." };
  if (trade.status !== "ACCEPTED") return { error: "Can only veto accepted trades." };

  const offeredIds   = trade.items.filter((i) => i.direction === "OFFERED").map((i) => i.teamId);
  const requestedIds = trade.items.filter((i) => i.direction === "REQUESTED").map((i) => i.teamId);

  const [offeredUTs, requestedUTs, offeredTeams, requestedTeams] = await Promise.all([
    // Reverse: offered teams are now with recipient → move back to proposer
    prisma.userTeam.findMany({ where: { userId: trade.recipientId, teamId: { in: offeredIds } } }),
    // Reverse: requested teams are now with proposer → move back to recipient
    prisma.userTeam.findMany({ where: { userId: trade.proposerId,  teamId: { in: requestedIds } } }),
    prisma.team.findMany({ where: { id: { in: offeredIds } },   select: { name: true } }),
    prisma.team.findMany({ where: { id: { in: requestedIds } }, select: { name: true } }),
  ]);

  await prisma.$transaction([
    ...offeredUTs.map((ut) =>
      prisma.userTeam.update({ where: { id: ut.id }, data: { userId: trade.proposerId } })
    ),
    ...requestedUTs.map((ut) =>
      prisma.userTeam.update({ where: { id: ut.id }, data: { userId: trade.recipientId } })
    ),
    prisma.trade.update({ where: { id: tradeId }, data: { status: "VETOED" } }),
    prisma.user.update({ where: { id: trade.proposerId  }, data: { hasNotification: true } }),
    prisma.user.update({ where: { id: trade.recipientId }, data: { hasNotification: true } }),
  ]);

  // Notify both parties
  sendTradeVetoedEmail({
    to: trade.proposer.email,
    name: trade.proposer.name ?? trade.proposer.email,
    offeredTeams,
    requestedTeams,
  }).catch(() => {});
  sendTradeVetoedEmail({
    to: trade.recipient.email,
    name: trade.recipient.name ?? trade.recipient.email,
    offeredTeams,
    requestedTeams,
  }).catch(() => {});

  revalidatePath("/trades");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return {};
}
