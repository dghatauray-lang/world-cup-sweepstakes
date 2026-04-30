"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertMatchAction, deleteMatchAction, STAGES } from "./actions";

type Team = { id: string; name: string; tier: string; flagUrl: string | null; group: string };
type MatchRow = {
  id: string;
  stage: string;
  kickoff: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
};

const TIER_BADGE: Record<string, string> = {
  S: "bg-purple-100 text-purple-700",
  A: "bg-yellow-100 text-yellow-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-gray-100 text-gray-500",
};

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "bg-gray-100 text-gray-500",
  LIVE:      "bg-green-100 text-green-700",
  FINISHED:  "bg-blue-100 text-blue-700",
};

const STAGE_ORDER = ["Group Stage","Round of 32","Round of 16","Quarter-final","Semi-final","Third Place","Final"];

function MatchForm({
  teams,
  initial,
  onDone,
}: {
  teams: Team[];
  initial?: Partial<MatchRow>;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [homeTeamId, setHomeTeamId] = useState(initial?.homeTeam?.id ?? "");
  const [awayTeamId, setAwayTeamId] = useState(initial?.awayTeam?.id ?? "");
  const [stage, setStage]           = useState(initial?.stage ?? "Group Stage");
  const [status, setStatus]         = useState<"SCHEDULED"|"LIVE"|"FINISHED">(
    (initial?.status as "SCHEDULED"|"LIVE"|"FINISHED") ?? "FINISHED"
  );
  const [homeScore, setHomeScore]   = useState<string>(initial?.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore]   = useState<string>(initial?.awayScore?.toString() ?? "");
  const [kickoff, setKickoff]       = useState(
    initial?.kickoff ? new Date(initial.kickoff).toISOString().slice(0,16) : ""
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await upsertMatchAction({
        id: initial?.id,
        homeTeamId,
        awayTeamId,
        stage,
        kickoff: kickoff || new Date().toISOString(),
        homeScore: homeScore !== "" ? parseInt(homeScore) : null,
        awayScore: awayScore !== "" ? parseInt(awayScore) : null,
        status,
      });
      if (result.error) { setError(result.error); return; }
      router.refresh();
      onDone();
    });
  }

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Home Team</label>
          <select value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)} required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5">
            <option value="">— Select —</option>
            {sortedTeams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.tier})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Away Team</label>
          <select value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)} required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5">
            <option value="">— Select —</option>
            {sortedTeams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.tier})</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Stage</label>
          <select value={stage} onChange={e => setStage(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5">
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as typeof status)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5">
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="FINISHED">Finished</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Kickoff</label>
          <input type="datetime-local" value={kickoff} onChange={e => setKickoff(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Home Score</label>
          <input type="number" min="0" value={homeScore} onChange={e => setHomeScore(e.target.value)}
            placeholder="e.g. 2"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Away Score</label>
          <input type="number" min="0" value={awayScore} onChange={e => setAwayScore(e.target.value)}
            placeholder="e.g. 1"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors">
          {isPending ? "Saving…" : initial?.id ? "Update Match" : "Add Match"}
        </button>
        <button type="button" onClick={onDone}
          className="text-sm text-gray-500 hover:text-gray-800 px-4 py-1.5 rounded-lg border border-gray-200 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function MatchPanel({ teams, matches }: { teams: Team[]; matches: MatchRow[] }) {
  const [showAdd, setShowAdd]       = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete(id: string) {
    if (!confirm("Delete this match? Points will be recalculated.")) return;
    startTransition(async () => {
      await deleteMatchAction(id);
      router.refresh();
    });
  }

  const grouped = STAGE_ORDER.map(stage => ({
    stage,
    matches: matches.filter(m => m.stage === stage),
  })).filter(g => g.matches.length > 0);

  return (
    <div className="space-y-4">
      {!showAdd ? (
        <button onClick={() => setShowAdd(true)}
          className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
          + Add Match Result
        </button>
      ) : (
        <MatchForm teams={teams} onDone={() => setShowAdd(false)} />
      )}

      {matches.length === 0 && (
        <p className="text-sm text-gray-400">No matches entered yet. Add the first result above.</p>
      )}

      {grouped.map(({ stage, matches: stageMatches }) => (
        <div key={stage}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{stage}</h3>
          <div className="space-y-2">
            {stageMatches.map(m => (
              <div key={m.id}>
                {editingId === m.id ? (
                  <MatchForm teams={teams} initial={m} onDone={() => setEditingId(null)} />
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5 text-sm">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[m.status]}`}>
                      {m.status}
                    </span>
                    <span className="flex items-center gap-1.5 flex-1 min-w-0">
                      {m.homeTeam.flagUrl && <img src={m.homeTeam.flagUrl} alt="" className="w-4 h-3 object-cover rounded-sm" />}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${TIER_BADGE[m.homeTeam.tier]}`}>{m.homeTeam.tier}</span>
                      <span className="font-medium truncate">{m.homeTeam.name}</span>
                    </span>
                    <span className="font-mono font-bold text-gray-700 flex-shrink-0 w-12 text-center">
                      {m.homeScore !== null && m.awayScore !== null ? `${m.homeScore}–${m.awayScore}` : "vs"}
                    </span>
                    <span className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                      <span className="font-medium truncate">{m.awayTeam.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${TIER_BADGE[m.awayTeam.tier]}`}>{m.awayTeam.tier}</span>
                      {m.awayTeam.flagUrl && <img src={m.awayTeam.flagUrl} alt="" className="w-4 h-3 object-cover rounded-sm" />}
                    </span>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setEditingId(m.id)}
                        className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(m.id)} disabled={isPending}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                        Del
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
