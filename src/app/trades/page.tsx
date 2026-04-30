import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProposeTradeForm from "./ProposeTradeForm";
import TradeCard from "./TradeCard";

export default async function TradesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const myId = session.user.id;

  const [myTeams, allUsers, allUserTeams, myTrades, gameState] = await Promise.all([
    prisma.userTeam.findMany({
      where: { userId: myId },
      include: { team: { select: { id: true, name: true, tier: true, flagUrl: true } } },
      orderBy: [{ team: { tier: "asc" } }],
    }),
    prisma.user.findMany({
      where: { isHouse: false, id: { not: myId } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.userTeam.findMany({
      where: { user: { isHouse: false } },
      include: { team: { select: { id: true, name: true, tier: true, flagUrl: true } } },
    }),
    prisma.trade.findMany({
      where: { OR: [{ proposerId: myId }, { recipientId: myId }] },
      include: {
        proposer:  { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
        items: { include: { team: { select: { id: true, name: true, tier: true, flagUrl: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gameState.findUnique({ where: { id: "singleton" } }),
  ]);

  const draftDone = gameState?.draftDone ?? false;

  // Build userTeamsMap: userId → their teams
  const userTeamsMap: Record<string, { id: string; name: string; tier: string; flagUrl: string | null }[]> = {};
  for (const ut of allUserTeams) {
    if (!userTeamsMap[ut.userId]) userTeamsMap[ut.userId] = [];
    userTeamsMap[ut.userId].push(ut.team);
  }

  // Enrich trades with split offered/requested teams
  const enrichedTrades = myTrades.map((t) => ({
    id: t.id,
    status: t.status,
    message: t.message,
    createdAt: t.createdAt,
    proposer: t.proposer,
    recipient: t.recipient,
    offeredTeams:   t.items.filter((i) => i.direction === "OFFERED").map((i) => i.team),
    requestedTeams: t.items.filter((i) => i.direction === "REQUESTED").map((i) => i.team),
  }));

  const incoming = enrichedTrades.filter((t) => t.recipient.id === myId && t.status === "PENDING");
  const outgoing = enrichedTrades.filter((t) => t.proposer.id === myId);
  const resolved = enrichedTrades.filter((t) => t.recipient.id === myId && t.status !== "PENDING");

  return (
    <>
    <Navbar />
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold">Trading Block</h1>

      {!draftDone && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-4xl mb-3">🔒</p>
          <h2 className="text-lg font-semibold text-gray-700">Trading opens after the draft</h2>
          <p className="text-gray-500 text-sm mt-1">Come back once the admin has run the draft.</p>
        </div>
      )}

      {draftDone && (
        <>
          {/* Incoming — shown first so nothing is missed */}
          {incoming.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Incoming Proposals
                <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                  {incoming.length}
                </span>
              </h2>
              <div className="space-y-3">
                {incoming.map((t) => <TradeCard key={t.id} trade={t} myId={myId} />)}
              </div>
            </section>
          )}

          {/* Propose */}
          <section>
            <h2 className="text-lg font-semibold mb-3">New Proposal</h2>
            <ProposeTradeForm
              myTeams={myTeams.map((ut) => ut.team)}
              otherUsers={allUsers}
              userTeamsMap={userTeamsMap}
            />
          </section>

          {/* My outgoing */}
          {outgoing.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">My Proposals</h2>
              <div className="space-y-3">
                {outgoing.map((t) => <TradeCard key={t.id} trade={t} myId={myId} />)}
              </div>
            </section>
          )}

          {/* Resolved incoming */}
          {resolved.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-500">Past Received Trades</h2>
              <div className="space-y-3">
                {resolved.map((t) => <TradeCard key={t.id} trade={t} myId={myId} />)}
              </div>
            </section>
          )}
        </>
      )}
    </main>
    </>
  );
}
