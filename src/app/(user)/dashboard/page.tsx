import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const TIER_COLORS: Record<string, string> = {
  S: "bg-purple-50 border-purple-200",
  A: "bg-yellow-50 border-yellow-200",
  B: "bg-blue-50 border-blue-200",
  C: "bg-gray-50 border-gray-200",
};

const TIER_BADGE: Record<string, string> = {
  S: "bg-purple-100 text-purple-800",
  A: "bg-yellow-100 text-yellow-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-gray-100 text-gray-600",
};

const TIER_LABEL: Record<string, string> = {
  S: "Tier S — Elite",
  A: "Tier A — Contenders",
  B: "Tier B — Solid",
  C: "Tier C — Underdogs",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [userTeams, gameState, lastSync, leaderboardRank] = await Promise.all([
    prisma.userTeam.findMany({
      where: { userId: session.user.id },
      include: { team: true },
      orderBy: [{ team: { tier: "asc" } }, { points: "desc" }],
    }),
    prisma.gameState.findUnique({ where: { id: "singleton" } }),
    prisma.syncLog.findFirst({
      where: { success: true },
      orderBy: { syncedAt: "desc" },
    }),
    // Calculate this user's rank on the leaderboard
    prisma.userTeam.groupBy({
      by: ["userId"],
      _sum: { points: true },
    }),
  ]);

  const totalPoints = userTeams.reduce((sum, ut) => sum + ut.points, 0);

  // Compute rank
  const ranked = leaderboardRank
    .map((r) => ({ userId: r.userId, total: r._sum.points ?? 0 }))
    .sort((a, b) => b.total - a.total);
  const rank = ranked.findIndex((r) => r.userId === session.user.id) + 1;

  // Group teams by tier
  const byTier: Record<string, typeof userTeams> = { S: [], A: [], B: [], C: [] };
  for (const ut of userTeams) byTier[ut.team.tier].push(ut);

  const draftDone = gameState?.draftDone ?? false;

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Teams</h1>
          <p className="text-gray-500 text-sm mt-1">
            {session.user.name ?? session.user.email}
          </p>
        </div>
        {draftDone && userTeams.length > 0 && (
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{totalPoints}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total pts</p>
            </div>
            {rank > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-800">#{rank}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Rank</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Last sync */}
      {lastSync && (
        <p className="text-xs text-gray-400">
          Scores last updated {new Date(lastSync.syncedAt).toLocaleString()}
        </p>
      )}

      {/* No draft yet */}
      {!draftDone && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">⏳</p>
          <h2 className="text-lg font-semibold text-gray-700">Draft hasn&apos;t happened yet</h2>
          <p className="text-gray-500 text-sm mt-1">
            The admin will run the draft soon — check back here once it&apos;s done.
          </p>
        </div>
      )}

      {/* Draft done but no teams assigned to this user */}
      {draftDone && userTeams.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">😕</p>
          <h2 className="text-lg font-semibold text-gray-700">No teams assigned to you</h2>
          <p className="text-gray-500 text-sm mt-1">Contact the admin if you think this is a mistake.</p>
        </div>
      )}

      {/* Teams grouped by tier */}
      {draftDone && userTeams.length > 0 && (
        <div className="space-y-6">
          {(["S", "A", "B", "C"] as const).map((tier) => {
            const teams = byTier[tier];
            if (teams.length === 0) return null;
            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIER_BADGE[tier]}`}>
                    {tier}
                  </span>
                  <h2 className="text-sm font-semibold text-gray-700">{TIER_LABEL[tier]}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {teams.map((ut) => (
                    <div
                      key={ut.teamId}
                      className={`rounded-xl border p-4 flex items-center gap-3 ${TIER_COLORS[tier]}`}
                    >
                      {ut.team.flagUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ut.team.flagUrl}
                          alt={ut.team.name}
                          className="w-8 h-6 object-cover rounded-sm flex-shrink-0 shadow-sm"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{ut.team.name}</p>
                        <p className="text-xs text-gray-500">Group {ut.team.group}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg leading-none">{ut.points}</p>
                        <p className="text-xs text-gray-400">pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard CTA */}
      {draftDone && (
        <div className="pt-2">
          <Link
            href="/leaderboard"
            className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
          >
            View full leaderboard →
          </Link>
        </div>
      )}
    </main>
  );
}
