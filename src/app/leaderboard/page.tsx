import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default async function LeaderboardPage() {
  const session = await auth();

  const [rows, gameState, lastSync] = await Promise.all([
    prisma.userTeam.groupBy({
      by: ["userId"],
      _sum: { points: true },
      where: { user: { isHouse: false } },
    }),
    prisma.gameState.findUnique({ where: { id: "singleton" } }),
    prisma.syncLog.findFirst({
      where: { success: true },
      orderBy: { syncedAt: "desc" },
    }),
  ]);

  // Fetch user details for the grouped rows
  const userIds = rows.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Count teams per user
  const teamCounts = await prisma.userTeam.groupBy({
    by: ["userId"],
    _count: { teamId: true },
    where: { user: { isHouse: false } },
  });
  const teamCountMap = new Map(teamCounts.map((t) => [t.userId, t._count.teamId]));

  const ranked = rows
    .map((r) => ({
      userId: r.userId,
      user: userMap.get(r.userId),
      total: r._sum.points ?? 0,
      teamCount: teamCountMap.get(r.userId) ?? 0,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return (a.user?.name ?? "").localeCompare(b.user?.name ?? "");
    });

  const draftDone = gameState?.draftDone ?? false;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            {lastSync && (
              <p className="text-xs text-gray-400 mt-1">
                Updated {new Date(lastSync.syncedAt).toLocaleString()}
              </p>
            )}
          </div>
          {session && (
            <Link href="/dashboard" className="text-sm text-green-600 hover:text-green-800 font-medium">
              ← My Teams
            </Link>
          )}
        </div>

        {!draftDone ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <h2 className="text-lg font-semibold text-gray-700">Draft hasn&apos;t happened yet</h2>
            <p className="text-gray-500 text-sm mt-1">The leaderboard will appear once teams are assigned.</p>
          </div>
        ) : ranked.length === 0 ? (
          <p className="text-gray-400 text-sm">No scores yet.</p>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[360px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium w-12">#</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Player</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium w-20">Teams</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium w-24">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ranked.map((row, idx) => {
                  const rank = idx + 1;
                  const isMe = session?.user.id === row.userId;
                  return (
                    <tr
                      key={row.userId}
                      className={isMe ? "bg-green-50" : "hover:bg-gray-50"}
                    >
                      <td className="px-4 py-3 text-center">
                        <span className={rank <= 3 ? "text-base" : "text-gray-400 font-medium"}>
                          {MEDAL[rank] ?? rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {(row.user?.name ?? row.user?.email ?? "?")[0].toUpperCase()}
                          </span>
                          <div>
                            <p className={`font-medium ${isMe ? "text-green-700" : "text-gray-900"}`}>
                              {row.user?.name ?? row.user?.email ?? "Unknown"}
                              {isMe && <span className="text-xs text-green-500 ml-1">(you)</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{row.teamCount}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold text-base ${isMe ? "text-green-700" : "text-gray-900"}`}>
                          {row.total}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">pts</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
