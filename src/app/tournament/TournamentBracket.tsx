"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertMatchAction } from "@/app/(admin)/admin/actions";

const GROUPS_LEFT  = ["A","B","C","D","E","F"];
const GROUPS_RIGHT = ["G","H","I","J","K","L"];
const KNOCKOUT_STAGES = ["Round of 32","Round of 16","Quarter-final","Semi-final","Third Place","Final"];

type Team = { id: string; name: string; tier: string; flagUrl: string | null; group: string };
type Match = {
  id: string; stage: string; kickoff: string;
  status: string; homeScore: number | null; awayScore: number | null;
  homeTeam: Team; awayTeam: Team;
};

// ── Standings ────────────────────────────────────────────────────────────────

function calcStandings(group: string, teams: Team[], matches: Match[]) {
  const groupTeams = teams.filter((t) => t.group === group);
  const rows = new Map(groupTeams.map((t) => [t.id, { team: t, p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 }]));
  for (const m of matches) {
    if (m.stage !== "Group Stage" || m.status !== "FINISHED") continue;
    if (m.homeScore === null || m.awayScore === null) continue;
    const home = rows.get(m.homeTeam.id);
    const away = rows.get(m.awayTeam.id);
    if (!home || !away) continue;
    home.p++; away.p++;
    home.gf += m.homeScore; home.ga += m.awayScore;
    away.gf += m.awayScore; away.ga += m.homeScore;
    if (m.homeScore > m.awayScore)      { home.w++; home.pts += 3; away.l++; }
    else if (m.homeScore < m.awayScore) { away.w++; away.pts += 3; home.l++; }
    else                                { home.d++; home.pts++;    away.d++; away.pts++; }
  }
  return Array.from(rows.values())
    .map((r) => ({ ...r, gd: r.gf - r.ga }))
    .sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf || a.team.name.localeCompare(b.team.name));
}

// ── Result entry modal ───────────────────────────────────────────────────────

function ResultModal({ match, teams, onClose }: { match: Match | null; teams: Team[]; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [homeScore, setHomeScore] = useState(match?.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(match?.awayScore?.toString() ?? "");
  const [status, setStatus]       = useState<"SCHEDULED"|"LIVE"|"FINISHED">(
    (match?.status as "SCHEDULED"|"LIVE"|"FINISHED") ?? "FINISHED"
  );
  const [homeTeamId, setHomeTeamId] = useState(match?.homeTeam.id ?? "");
  const [awayTeamId, setAwayTeamId] = useState(match?.awayTeam.id ?? "");
  const [stage, setStage]           = useState(match?.stage ?? "Group Stage");
  const [kickoff, setKickoff]       = useState(
    match?.kickoff ? new Date(match.kickoff).toISOString().slice(0,16) : ""
  );
  const [error, setError] = useState<string|null>(null);
  const router = useRouter();
  const isNew = !match?.id;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await upsertMatchAction({
        id: match?.id,
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
      onClose();
    });
  }

  if (!match && !isNew) return null;

  const sortedTeams = [...teams].sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{isNew ? "Add Match" : "Edit Result"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isNew && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Home Team</label>
                  <select value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)} required
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5">
                    <option value="">— Select —</option>
                    {sortedTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Away Team</label>
                  <select value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)} required
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5">
                    <option value="">— Select —</option>
                    {sortedTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Stage</label>
                  <select value={stage} onChange={e => setStage(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5">
                    {["Group Stage",...KNOCKOUT_STAGES].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Kickoff</label>
                  <input type="datetime-local" value={kickoff} onChange={e => setKickoff(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
                </div>
              </div>
            </>
          )}

          {!isNew && (
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="flex items-center gap-2">
                {match?.homeTeam.flagUrl && <img src={match.homeTeam.flagUrl} alt="" className="w-6 h-4 object-cover rounded" />}
                <span className="font-semibold">{match?.homeTeam.name}</span>
              </div>
              <span className="text-gray-400 font-bold">vs</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{match?.awayTeam.name}</span>
                {match?.awayTeam.flagUrl && <img src={match.awayTeam.flagUrl} alt="" className="w-6 h-4 object-cover rounded" />}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 block mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as typeof status)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5">
              <option value="SCHEDULED">Scheduled</option>
              <option value="LIVE">Live</option>
              <option value="FINISHED">Finished</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                {isNew ? "Home Score" : `${match?.homeTeam.name} Score`}
              </label>
              <input type="number" min="0" value={homeScore} onChange={e => setHomeScore(e.target.value)}
                placeholder="0" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-center text-lg font-bold" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                {isNew ? "Away Score" : `${match?.awayTeam.name} Score`}
              </label>
              <input type="number" min="0" value={awayScore} onChange={e => setAwayScore(e.target.value)}
                placeholder="0" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-center text-lg font-bold" />
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 rounded-xl text-sm transition-colors">
              {isPending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Team pill ────────────────────────────────────────────────────────────────

const TIER_DOT: Record<string, string> = {
  S: "bg-purple-500",
  A: "bg-yellow-400",
  B: "bg-blue-400",
  C: "bg-gray-300",
};

function TeamRow({ team, myTeamIds, pos }: { team: { team: Team; pts: number; p: number }; myTeamIds: Set<string>; pos: number }) {
  const isMe = myTeamIds.has(team.team.id);
  const qualified = pos <= 2;
  return (
    <tr className={isMe ? "bg-green-50" : ""}>
      <td className="pl-3 pr-1 py-1.5 w-7">
        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0
          ${qualified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
          {pos}
        </span>
      </td>
      <td className="py-1.5 pr-2">
        <div className="flex items-center gap-2">
          {team.team.flagUrl
            ? <img src={team.team.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
            : <span className="w-5 h-3.5 flex-shrink-0" />}
          <span className={`text-xs font-medium leading-tight ${isMe ? "text-green-700 font-semibold" : "text-gray-800"}`}>
            {team.team.name}{isMe ? " ★" : ""}
          </span>
        </div>
      </td>
      <td className="text-center text-xs text-gray-400 py-1.5 w-7">{team.p}</td>
      <td className="text-center text-xs font-bold text-gray-700 py-1.5 pr-3 w-8">{team.pts}</td>
    </tr>
  );
}

// ── Group card ───────────────────────────────────────────────────────────────

function GroupCard({
  group, teams, matches, myTeamIds, isAdmin, onClickMatch,
}: {
  group: string; teams: Team[]; matches: Match[]; myTeamIds: Set<string>;
  isAdmin: boolean; onClickMatch: (m: Match) => void;
}) {
  const standings = calcStandings(group, teams, matches);
  const groupMatches = matches.filter(
    (m) => m.stage === "Group Stage" && (m.homeTeam.group === group || m.awayTeam.group === group)
  );

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden text-xs bg-white">
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5">
        <span className="font-bold text-sm text-gray-700">Group {group}</span>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-gray-400 border-b border-gray-100">
            <th className="w-7 pl-3" />
            <th className="text-left py-1.5 text-[11px] font-medium">Team</th>
            <th className="text-center py-1.5 text-[11px] font-medium w-7">P</th>
            <th className="text-center py-1.5 text-[11px] font-medium pr-3 w-8">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {standings.map((s, i) => (
            <TeamRow key={s.team.id} team={s} myTeamIds={myTeamIds} pos={i+1} />
          ))}
        </tbody>
      </table>

      {groupMatches.length > 0 && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {groupMatches.map((m) => {
            const finished = m.status === "FINISHED";
            const live     = m.status === "LIVE";
            const hasMe    = myTeamIds.has(m.homeTeam.id) || myTeamIds.has(m.awayTeam.id);
            return (
              <div key={m.id}
                className={`grid grid-cols-[1fr_2.5rem_1fr] items-center px-3 py-1.5 gap-x-1
                  ${hasMe ? "bg-green-50" : ""}
                  ${isAdmin ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100" : ""}`}
                onClick={() => isAdmin && onClickMatch(m)}>
                {/* Home */}
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {m.homeTeam.flagUrl
                    ? <img src={m.homeTeam.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
                    : <span className="w-5 flex-shrink-0" />}
                  <span className={`text-xs font-medium truncate ${myTeamIds.has(m.homeTeam.id) ? "text-green-700 font-semibold" : "text-gray-800"}`}>
                    {m.homeTeam.name}
                  </span>
                </div>
                {/* Score / date */}
                <div className="text-center flex-shrink-0">
                  {finished ? (
                    <span className="text-xs font-mono font-bold text-gray-700">
                      {m.homeScore}–{m.awayScore}
                    </span>
                  ) : live ? (
                    <span className="text-[10px] font-bold text-green-600 animate-pulse">LIVE</span>
                  ) : (
                    <span className="text-[10px] text-gray-400 leading-tight block text-center">
                      {new Date(m.kickoff).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                {/* Away */}
                <div className="flex items-center gap-1.5 overflow-hidden flex-row-reverse">
                  {m.awayTeam.flagUrl
                    ? <img src={m.awayTeam.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
                    : <span className="w-5 flex-shrink-0" />}
                  <span className={`text-xs font-medium truncate text-right ${myTeamIds.has(m.awayTeam.id) ? "text-green-700 font-semibold" : "text-gray-800"}`}>
                    {m.awayTeam.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Knockout match card ──────────────────────────────────────────────────────

function KnockoutCard({ match, myTeamIds, isAdmin, onClick }: {
  match: Match; myTeamIds: Set<string>; isAdmin: boolean; onClick: () => void;
}) {
  const finished = match.status === "FINISHED";
  const live     = match.status === "LIVE";
  const hasMe    = myTeamIds.has(match.homeTeam.id) || myTeamIds.has(match.awayTeam.id);

  return (
    <div
      className={`rounded-lg border p-2 text-xs ${hasMe ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"} ${isAdmin ? "cursor-pointer hover:border-green-400" : ""}`}
      onClick={() => isAdmin && onClick()}
    >
      {[{ team: match.homeTeam, score: match.homeScore }, { team: match.awayTeam, score: match.awayScore }].map(({ team, score }, i) => {
        const isMe = myTeamIds.has(team.id);
        const won = finished && (i === 0 ? (match.homeScore ?? 0) > (match.awayScore ?? 0) : (match.awayScore ?? 0) > (match.homeScore ?? 0));
        return (
          <div key={team.id} className={`flex items-center gap-1.5 py-0.5 ${i === 0 ? "border-b border-gray-100" : ""}`}>
            {team.flagUrl && <img src={team.flagUrl} alt="" className="w-4 h-2.5 object-cover rounded-sm flex-shrink-0" />}
            <span className={`flex-1 truncate font-medium ${isMe ? "text-green-700" : ""} ${won ? "font-bold" : ""}`}>
              {team.name || "TBD"}{isMe ? " ★" : ""}
            </span>
            <span className={`font-mono font-bold ${won ? "text-gray-900" : "text-gray-400"}`}>
              {finished ? score : live && i === 0 ? <span className="text-green-600 animate-pulse text-[9px]">LIVE</span> : ""}
            </span>
          </div>
        );
      })}
      {!finished && match.kickoff && (
        <p className="text-[9px] text-gray-400 text-center mt-0.5">
          {new Date(match.kickoff).toLocaleDateString(undefined, { day:"numeric", month:"short" })}
        </p>
      )}
    </div>
  );
}

// ── Main bracket ─────────────────────────────────────────────────────────────

export default function TournamentBracket({
  matches, teams, myTeamIds: myTeamIdsArr, isAdmin,
}: {
  matches: Match[]; teams: Team[]; myTeamIds: string[]; isAdmin: boolean;
}) {
  const myTeamIds = new Set(myTeamIdsArr);
  const [editingMatch, setEditingMatch] = useState<Match | null | undefined>(undefined);
  const [addGroup, setAddGroup] = useState<string | null>(null);

  function openEdit(m: Match) { setEditingMatch(m); setAddGroup(null); }
  function openAdd(group: string) { setAddGroup(group); setEditingMatch(null); }
  function closeModal() { setEditingMatch(undefined); setAddGroup(null); }

  const groupMatches = matches.filter((m) => m.stage === "Group Stage");
  const knockoutMatches = matches.filter((m) => KNOCKOUT_STAGES.includes(m.stage));

  const totalFinished = matches.filter(m => m.status === "FINISHED").length;
  const totalLive = matches.filter(m => m.status === "LIVE").length;

  const blankMatch: Match = {
    id: "", stage: addGroup ? "Group Stage" : "Round of 32", kickoff: "",
    status: "FINISHED", homeScore: null, awayScore: null,
    homeTeam: { id: "", name: "", tier: "", flagUrl: null, group: addGroup ?? "" },
    awayTeam: { id: "", name: "", tier: "", flagUrl: null, group: addGroup ?? "" },
  };

  return (
    <>
      {(editingMatch !== undefined || addGroup !== null) && (
        <ResultModal
          match={editingMatch ?? (addGroup ? blankMatch : null)}
          teams={teams}
          onClose={closeModal}
        />
      )}

      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">WC 2026 Tournament</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {totalFinished} played · {totalLive > 0 ? `${totalLive} live · ` : ""}
              {matches.length - totalFinished - totalLive} scheduled
              {myTeamIds.size > 0 && <span className="ml-2 text-green-600 font-medium">★ = your team</span>}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => openAdd("A")}
                className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                + Add Match
              </button>
            </div>
          )}
        </div>

        {/* Group Stage */}
        <section>
          <h2 className="text-lg font-bold mb-4">Group Stage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {["A","B","C","D","E","F","G","H","I","J","K","L"].map((group) => {
              const groupTeams = teams.filter((t) => t.group === group);
              if (groupTeams.length === 0) return null;
              return (
                <GroupCard
                  key={group}
                  group={group}
                  teams={teams}
                  matches={groupMatches}
                  myTeamIds={myTeamIds}
                  isAdmin={isAdmin}
                  onClickMatch={openEdit}
                />
              );
            })}
          </div>
        </section>

        {/* Knockout */}
        <section>
          <h2 className="text-lg font-bold mb-4">Knockout Rounds</h2>
          {knockoutMatches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
              <p className="text-3xl mb-2">🏆</p>
              <p className="text-gray-500 text-sm">Knockout matches will appear here once the group stage concludes.</p>
              {isAdmin && (
                <button onClick={() => openAdd("")}
                  className="mt-4 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg">
                  + Add Knockout Match
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-max">
                {KNOCKOUT_STAGES.map((stage) => {
                  const stageMatches = knockoutMatches.filter((m) => m.stage === stage);
                  if (stageMatches.length === 0) return null;
                  return (
                    <div key={stage} className="flex flex-col gap-2">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
                        {stage === "Final" ? "🏆 Final" : stage === "Third Place" ? "🥉 3rd Place" : stage}
                      </h3>
                      <div className={`flex flex-col gap-2 ${
                        stage === "Round of 32" ? "justify-around" :
                        stage === "Round of 16" ? "justify-around" :
                        stage === "Quarter-final" ? "justify-around" :
                        stage === "Semi-final" ? "justify-center gap-8" :
                        "justify-center"
                      }`}
                        style={{ minHeight: stage === "Round of 32" ? "640px" : stage === "Round of 16" ? "480px" : stage === "Quarter-final" ? "320px" : stage === "Semi-final" ? "200px" : "auto" }}
                      >
                        {stageMatches.map((m) => (
                          <div key={m.id} className="w-40">
                            <KnockoutCard match={m} myTeamIds={myTeamIds} isAdmin={isAdmin} onClick={() => openEdit(m)} />
                          </div>
                        ))}
                      </div>
                      {isAdmin && (
                        <button onClick={() => openAdd("knockout")}
                          className="text-[10px] text-green-600 hover:text-green-800 text-center mt-1">
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
