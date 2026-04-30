import { prisma } from "@/lib/prisma";
import { fetchLiveAndRecentFixtures, normalizeTeamName, mapStatus, normalizeStage } from "@/lib/sports-api";
import { calcMatchPoints } from "@/lib/points";

export interface SyncResult {
  matchesUpserted: number;
  pointsRecalculated: boolean;
  requestsUsed?: number;
  error?: string;
}

// Build a lookup map from team name → team id, and apiTeamId → team id.
// When we see a new API team ID we haven't mapped yet, we match by name and
// persist the apiTeamId so future syncs can use the faster ID lookup.
async function buildTeamLookup() {
  const teams = await prisma.team.findMany();
  const byApiId = new Map(teams.filter(t => t.apiTeamId != null).map(t => [t.apiTeamId!, t.id]));
  const byName  = new Map(teams.map(t => [t.name.toLowerCase(), t.id]));
  return { teams, byApiId, byName };
}

async function resolveTeamId(
  apiId: number,
  apiName: string,
  lookup: { byApiId: Map<number, string>; byName: Map<string, string> }
): Promise<string | null> {
  // Fast path: already have a mapping for this API team ID
  if (lookup.byApiId.has(apiId)) return lookup.byApiId.get(apiId)!;

  // Slow path: match by normalised name and persist the apiTeamId for next time
  const normalised = normalizeTeamName(apiName).toLowerCase();
  const teamId = lookup.byName.get(normalised);
  if (teamId) {
    await prisma.team.update({ where: { id: teamId }, data: { apiTeamId: apiId } });
    lookup.byApiId.set(apiId, teamId);
  }

  return teamId ?? null;
}

// Recalculate every user's points from scratch using all finished matches in the DB.
// This is intentionally called after every sync so the numbers are always correct,
// even if the points formula is later adjusted.
async function recalculateAllPoints() {
  const matches = await prisma.match.findMany({
    where: { status: "FINISHED" },
  });

  const teamPoints = new Map<string, number>();

  for (const m of matches) {
    if (m.homeScore == null || m.awayScore == null) continue;
    const hp = calcMatchPoints({ goalsFor: m.homeScore, goalsAgainst: m.awayScore, stage: m.stage });
    const ap = calcMatchPoints({ goalsFor: m.awayScore, goalsAgainst: m.homeScore, stage: m.stage });
    teamPoints.set(m.homeTeamId, (teamPoints.get(m.homeTeamId) ?? 0) + hp);
    teamPoints.set(m.awayTeamId, (teamPoints.get(m.awayTeamId) ?? 0) + ap);
  }

  if (teamPoints.size === 0) return;

  // Reset all points to 0 first, then set the recalculated values
  await prisma.$transaction([
    prisma.userTeam.updateMany({ data: { points: 0 } }),
    ...Array.from(teamPoints.entries()).map(([teamId, points]) =>
      prisma.userTeam.updateMany({ where: { teamId }, data: { points } })
    ),
  ]);
}

export async function runSync(): Promise<SyncResult> {
  let matchesUpserted = 0;

  try {
    const fixtures = await fetchLiveAndRecentFixtures();
    const lookup = await buildTeamLookup();

    for (const f of fixtures) {
      const status = mapStatus(f.fixture.status.short);
      const stage  = normalizeStage(f.league.round);
      const homeScore = f.goals.home ?? undefined;
      const awayScore = f.goals.away ?? undefined;

      const homeTeamId = await resolveTeamId(f.teams.home.id, f.teams.home.name, lookup);
      const awayTeamId = await resolveTeamId(f.teams.away.id, f.teams.away.name, lookup);

      // Skip if we can't match either team to our DB (unqualified team or name mismatch)
      if (!homeTeamId || !awayTeamId) continue;

      await prisma.match.upsert({
        where: { apiMatchId: f.fixture.id },
        update: { homeScore, awayScore, status, stage },
        create: {
          apiMatchId: f.fixture.id,
          stage,
          kickoff: new Date(f.fixture.date),
          status,
          homeScore,
          awayScore,
          homeTeam: { connect: { id: homeTeamId } },
          awayTeam: { connect: { id: awayTeamId } },
        },
      });

      matchesUpserted++;
    }

    // Always recalculate points from scratch after syncing
    await recalculateAllPoints();

    await prisma.syncLog.create({
      data: { matchesUpdated: matchesUpserted, success: true },
    });

    return { matchesUpserted, pointsRecalculated: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await prisma.syncLog.create({
      data: { matchesUpdated: matchesUpserted, success: false, error },
    });
    return { matchesUpserted, pointsRecalculated: false, error };
  }
}
