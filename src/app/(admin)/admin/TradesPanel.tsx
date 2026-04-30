"use client";

import { useTransition } from "react";
import { vetoTradeAction } from "../../trades/actions";

const TIER_BADGE: Record<string, string> = {
  S: "bg-purple-100 text-purple-700",
  A: "bg-yellow-100 text-yellow-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-gray-100 text-gray-600",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  VETOED:   "bg-gray-100 text-gray-500",
};

type Team = { id: string; name: string; tier: string; flagUrl: string | null };
type TradeSummary = {
  id: string;
  status: string;
  createdAt: Date;
  proposer:  { name: string | null; email: string };
  recipient: { name: string | null; email: string };
  offeredTeams: Team[];
  requestedTeams: Team[];
};

function TeamPill({ team }: { team: Team }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${TIER_BADGE[team.tier] ?? "bg-gray-100"}`}>
      {team.flagUrl && <img src={team.flagUrl} alt="" className="w-3.5 h-2.5 object-cover rounded-sm" />}
      {team.name}
    </span>
  );
}

function VetoButton({ tradeId }: { tradeId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => { await vetoTradeAction(tradeId); })}
      disabled={isPending}
      className="text-xs border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 px-3 py-1 rounded-lg transition-colors"
    >
      {isPending ? "Vetoing…" : "Veto"}
    </button>
  );
}

export default function TradesPanel({ trades }: { trades: TradeSummary[] }) {
  if (trades.length === 0) {
    return <p className="text-sm text-gray-400">No trades have been made yet.</p>;
  }

  return (
    <div className="space-y-3">
      {trades.map((t) => (
        <div key={t.id} className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm">
                <span className="font-semibold">{t.proposer.name ?? t.proposer.email}</span>
                <span className="text-gray-400 mx-1.5">↔</span>
                <span className="font-semibold">{t.recipient.name ?? t.recipient.email}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(t.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[t.status] ?? "bg-gray-100"}`}>
                {t.status}
              </span>
              {t.status === "ACCEPTED" && <VetoButton tradeId={t.id} />}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Offered</p>
              <div className="flex flex-wrap gap-1">{t.offeredTeams.map((tm) => <TeamPill key={tm.id} team={tm} />)}</div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Requested</p>
              <div className="flex flex-wrap gap-1">{t.requestedTeams.map((tm) => <TeamPill key={tm.id} team={tm} />)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
