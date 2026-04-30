"use client";

import { useTransition } from "react";
import { respondToTradeAction } from "./actions";

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
  VETOED:   "bg-gray-100 text-gray-600",
};

type Team = { id: string; name: string; tier: string; flagUrl: string | null };

type TradeProp = {
  id: string;
  status: string;
  message: string | null;
  createdAt: Date;
  proposer: { id: string; name: string | null; email: string };
  recipient: { id: string; name: string | null; email: string };
  offeredTeams: Team[];
  requestedTeams: Team[];
};

function TeamPill({ team }: { team: Team }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${TIER_BADGE[team.tier] ?? "bg-gray-100"}`}>
      {team.flagUrl && <img src={team.flagUrl} alt="" className="w-3.5 h-2.5 object-cover rounded-sm" />}
      {team.name}
    </span>
  );
}

export default function TradeCard({
  trade,
  myId,
}: {
  trade: TradeProp;
  myId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const isRecipient = trade.recipient.id === myId;
  const canRespond  = isRecipient && trade.status === "PENDING";

  function respond(accept: boolean) {
    startTransition(async () => {
      await respondToTradeAction(trade.id, accept);
    });
  }

  const proposerName  = trade.proposer.name  ?? trade.proposer.email;
  const recipientName = trade.recipient.name ?? trade.recipient.email;

  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{proposerName}</span>
          {" → "}
          <span className="font-semibold text-gray-800">{recipientName}</span>
        </p>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[trade.status] ?? "bg-gray-100"}`}>
          {trade.status}
        </span>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400 mb-1.5">
            {proposerName} offers
          </p>
          <div className="flex flex-wrap gap-1.5">
            {trade.offeredTeams.map((t) => <TeamPill key={t.id} team={t} />)}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1.5">
            {proposerName} wants
          </p>
          <div className="flex flex-wrap gap-1.5">
            {trade.requestedTeams.map((t) => <TeamPill key={t.id} team={t} />)}
          </div>
        </div>
      </div>

      {/* Message */}
      {trade.message && (
        <p className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-3">
          &ldquo;{trade.message}&rdquo;
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-400">
          {new Date(trade.createdAt).toLocaleDateString()}
        </p>
        {canRespond && (
          <div className="flex gap-2">
            <button
              onClick={() => respond(false)}
              disabled={isPending}
              className="text-xs border border-gray-300 hover:bg-gray-50 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => respond(true)}
              disabled={isPending}
              className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              {isPending ? "…" : "Accept"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
