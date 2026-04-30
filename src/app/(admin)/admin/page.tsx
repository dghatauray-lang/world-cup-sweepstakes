import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DraftPanel from "./DraftPanel";
import SyncPanel from "./SyncPanel";
import TradesPanel from "./TradesPanel";
import AdjustPanel from "./AdjustPanel";

const TIER_COLORS: Record<string, string> = {
  S: "bg-purple-100 text-purple-800",
  A: "bg-yellow-100 text-yellow-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-gray-100 text-gray-600",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [gameState, users, assignments, syncLogs, allTrades] = await Promise.all([
    prisma.gameState.findUnique({ where: { id: "singleton" } }),
    prisma.user.findMany({
      where: { isHouse: false },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userTeam.findMany({
      include: {
        user: { select: { name: true, email: true, isHouse: true } },
        team: { select: { name: true, tier: true, flagUrl: true } },
      },
      orderBy: { assignedAt: "asc" },
    }),
    prisma.syncLog.findMany({ orderBy: { syncedAt: "desc" }, take: 10 }),
    prisma.trade.findMany({
      include: {
        proposer:  { select: { name: true, email: true } },
        recipient: { select: { name: true, email: true } },
        items: { include: { team: { select: { id: true, name: true, tier: true, flagUrl: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const draftDone = gameState?.draftDone ?? false;

  // Group assignments by user for display
  const byUser: Record<
    string,
    { userName: string; email: string; isHouse: boolean; teams: typeof assignments }
  > = {};
  for (const a of assignments) {
    const key = a.userId;
    if (!byUser[key]) {
      byUser[key] = {
        userName: a.user.name ?? a.user.email,
        email: a.user.email,
        isHouse: a.user.isHouse,
        teams: [],
      };
    }
    byUser[key].teams.push(a);
  }

  const userEntries = Object.entries(byUser).sort((a, b) => {
    if (a[1].isHouse) return 1;
    if (b[1].isHouse) return -1;
    return a[1].userName.localeCompare(b[1].userName);
  });

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">⚙️ Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">World Cup 2026 Sweepstakes</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${draftDone ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
          {draftDone ? "Draft Complete" : "Draft Pending"}
        </span>
      </div>

      {/* Registered Users */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Registered Users ({users.length})</h2>
        {users.length === 0 ? (
          <p className="text-gray-400 text-sm">No users have signed up yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {(u.name ?? u.email)[0].toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{u.name ?? "—"}</p>
                  <p className="text-gray-400 text-xs truncate">{u.email}</p>
                </div>
                {u.role === "ADMIN" && (
                  <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex-shrink-0">Admin</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Draft Section */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Draft</h2>
        {draftDone ? (
          <p className="text-sm text-gray-500 mb-4">
            Draft ran on {gameState?.draftAt ? new Date(gameState.draftAt).toLocaleString() : "unknown date"}.
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            Generate a preview to see how the 48 teams will be distributed, then confirm to lock it in.
            Teams are distributed using value-equalising draft logic — elite team holders get fewer teams overall.
          </p>
        )}

        {!draftDone && <DraftPanel userCount={users.length} />}
      </section>

      {/* Score Sync */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Score Sync</h2>
        <p className="text-sm text-gray-500 mb-4">
          Runs automatically every 15 minutes via Vercel Cron once deployed.
          Use the button below to trigger a manual sync or verify the API connection.
        </p>
        <SyncPanel recentLogs={syncLogs} />
      </section>

      {/* Trades */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Trades</h2>
        <p className="text-sm text-gray-500 mb-4">
          Veto any completed trade to reverse it. Both teams return to their original owners.
        </p>
        <TradesPanel
          trades={allTrades.map((t) => ({
            id: t.id,
            status: t.status,
            createdAt: t.createdAt,
            proposer: t.proposer,
            recipient: t.recipient,
            offeredTeams:   t.items.filter((i) => i.direction === "OFFERED").map((i) => i.team),
            requestedTeams: t.items.filter((i) => i.direction === "REQUESTED").map((i) => i.team),
          }))}
        />
      </section>

      {/* Manual Adjustments */}
      {draftDone && (
        <section>
          <h2 className="text-lg font-semibold mb-1">Manual Adjustments</h2>
          <p className="text-sm text-gray-500 mb-4">
            Override points for a specific team, or move a team between users.
          </p>
          <AdjustPanel
            users={userEntries
              .filter(([, { isHouse }]) => !isHouse)
              .map(([id, { userName, email, teams }]) => ({
                id,
                name: userName,
                email,
                teams: teams.map((a) => ({
                  id: a.teamId,
                  name: a.team.name,
                  tier: a.team.tier,
                  points: a.points,
                })),
              }))}
          />
        </section>
      )}

      {/* Post-draft assignments */}
      {draftDone && assignments.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Assignments</h2>
          <div className="grid gap-4">
            {userEntries.map(([userId, { userName, email, isHouse, teams }]) => (
              <div
                key={userId}
                className={`rounded-xl border p-4 ${isHouse ? "border-dashed border-gray-300 bg-gray-50" : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">
                      {isHouse ? "🏠 House" : userName}
                    </p>
                    {!isHouse && <p className="text-xs text-gray-400">{email}</p>}
                  </div>
                  <span className="text-xs text-gray-500">{teams.length} teams</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {teams
                    .sort((a, b) => a.team.tier.localeCompare(b.team.tier))
                    .map((a) => (
                      <span
                        key={a.teamId}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${TIER_COLORS[a.team.tier] ?? "bg-gray-100"}`}
                      >
                        {a.team.flagUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.team.flagUrl} alt="" className="inline w-3 h-3 mr-1 rounded-sm" />
                        )}
                        {a.team.name}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
