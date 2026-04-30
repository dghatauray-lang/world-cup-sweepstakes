"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAssignments, commitDraft } from "@/lib/draft";
import { runSync, type SyncResult } from "@/lib/sync";
import { fetchApiStatus } from "@/lib/sports-api";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");
}

export type PreviewRow = {
  userId: string;
  teamId: string;
  userName: string;
  teamName: string;
  teamTier: string;
  isHouse: boolean;
};

export async function previewDraftAction(): Promise<PreviewRow[]> {
  await assertAdmin();

  const [users, teams, house, gameState] = await Promise.all([
    prisma.user.findMany({
      where: { isHouse: false },
      select: { id: true, name: true, email: true },
    }),
    prisma.team.findMany(),
    prisma.user.findFirst({ where: { isHouse: true } }),
    prisma.gameState.findUnique({ where: { id: "singleton" } }),
  ]);

  if (gameState?.draftDone) throw new Error("Draft has already been completed.");
  if (!house) throw new Error("House account not found in DB.");
  if (users.length === 0) throw new Error("No registered users to draft.");

  const assignments = generateAssignments(users, teams, house);
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const userMap = new Map([...users, house].map((u) => [u.id, u]));

  return assignments.map((a) => {
    const u = userMap.get(a.userId);
    const t = teamMap.get(a.teamId);
    return {
      userId: a.userId,
      teamId: a.teamId,
      userName: u?.name ?? u?.email ?? a.userId,
      teamName: t?.name ?? a.teamId,
      teamTier: t?.tier ?? "?",
      isHouse: a.userId === house.id,
    };
  });
}

export async function confirmDraftAction(
  assignments: { userId: string; teamId: string }[]
): Promise<void> {
  await assertAdmin();
  await commitDraft(assignments);
  revalidatePath("/admin");
}

export async function triggerSyncAction(): Promise<SyncResult> {
  await assertAdmin();
  const result = await runSync();
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  return result;
}

export async function checkApiStatusAction(): Promise<{
  account: string;
  requests: { current: number; limit: number };
}> {
  await assertAdmin();
  return fetchApiStatus();
}

export async function resetDraftAction(): Promise<void> {
  await assertAdmin();
  await prisma.$transaction([
    prisma.userTeam.deleteMany({}),
    prisma.trade.deleteMany({}),
    prisma.gameState.update({
      where: { id: "singleton" },
      data: { draftDone: false, draftAt: null },
    }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}

export async function adjustPointsAction(
  userId: string,
  teamId: string,
  delta: number
): Promise<void> {
  await assertAdmin();
  await prisma.userTeam.updateMany({
    where: { userId, teamId },
    data: { points: { increment: delta } },
  });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}

export async function reassignTeamAction(
  teamId: string,
  fromUserId: string,
  toUserId: string
): Promise<void> {
  await assertAdmin();
  const ut = await prisma.userTeam.findFirst({ where: { teamId, userId: fromUserId } });
  if (!ut) throw new Error("Team not found for that user.");
  await prisma.userTeam.update({ where: { id: ut.id }, data: { userId: toUserId } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}
