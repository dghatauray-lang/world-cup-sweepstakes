import { prisma } from "@/lib/prisma";
import type { Team, User } from "@prisma/client";

// Draft value per tier — used to equalise allocation quality across players
const TIER_VALUE: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pure function — no DB writes.
// Algorithm: value-equalising greedy draft.
//   Teams are assigned one at a time (highest tier first).
//   Each team goes to whichever user currently has the lowest
//   allocation value. This means users who land an elite team
//   accumulate value fast and are skipped for subsequent elite picks,
//   while users who miss out keep receiving teams until their value
//   catches up — giving them more teams overall as compensation.
export function generateAssignments(
  users: Pick<User, "id">[],
  teams: Team[],
  house: Pick<User, "id">
): { userId: string; teamId: string }[] {
  if (users.length === 0) return [];

  // Shuffle within each tier then sort S→A→B→C
  const byTier: Record<string, Team[]> = { S: [], A: [], B: [], C: [] };
  for (const team of teams) {
    if (team.tier in byTier) byTier[team.tier].push(team);
  }
  for (const tier of Object.keys(byTier)) byTier[tier] = shuffle(byTier[tier]);
  const queue = [...byTier.S, ...byTier.A, ...byTier.B, ...byTier.C];

  const totalValue = queue.reduce((s, t) => s + (TIER_VALUE[t.tier] ?? 1), 0);
  const targetPerUser = totalValue / users.length;

  // Track current allocation value per user
  const values = new Map<string, number>(users.map((u) => [u.id, 0]));
  const assignments: { userId: string; teamId: string }[] = [];

  for (const team of queue) {
    const tv = TIER_VALUE[team.tier] ?? 1;

    // Find the minimum current value among all users
    const minVal = Math.min(...values.values());

    // If every user is already at or above target, the rest go to House
    if (minVal >= targetPerUser) {
      assignments.push({ userId: house.id, teamId: team.id });
      continue;
    }

    // Among users tied at the minimum, pick one at random for fairness
    const candidates = [...values.entries()]
      .filter(([, v]) => v === minVal)
      .map(([id]) => id);
    const userId = candidates[Math.floor(Math.random() * candidates.length)];

    assignments.push({ userId, teamId: team.id });
    values.set(userId, minVal + tv);
  }

  return assignments;
}

// Saves pre-generated assignments to DB atomically.
export async function commitDraft(
  assignments: { userId: string; teamId: string }[]
): Promise<void> {
  const gameState = await prisma.gameState.findUnique({ where: { id: "singleton" } });
  if (gameState?.draftDone) throw new Error("Draft has already been run.");

  await prisma.$transaction([
    prisma.userTeam.createMany({ data: assignments }),
    prisma.gameState.update({
      where: { id: "singleton" },
      data: { draftDone: true, draftAt: new Date() },
    }),
  ]);
}
