import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";

const TIER_BADGE: Record<string, string> = {
  S: "bg-purple-100 text-purple-700",
  A: "bg-yellow-100 text-yellow-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-gray-100 text-gray-600",
};

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const KNOCKOUT_STAGES = ["Round of 32","Round of 16","Quarter-final","Semi-final","Third Place","Final"];

type Team = {
  id: string; name: string; tier: string; flagUrl: string | null; group: string;
};
type MatchWithTeams = {
  id: string; stage: string; kickoff: Date;
  status: string; homeScore: number | null; awayScore: number | null;
  homeTeam: Team; awayTeam: Team;
};

type Standing = {
  team: Team; p: number; w: number; d: number; l: number;
  gf: number; ga: number; gd: number; pts: number;
};

function calcGroupStandings(group: string, teams: Team[], matches: MatchWithTeams[]): Standing[] {
  const groupTeams = teams.filter(t => t.group === group);
  const rows = new Map<string, Standing>(
    groupTeams.map(t => [t.id, { team: t, p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0 }])
  );

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
    .map(r => ({ ...r, gd: r.gf - r.ga }))
    .sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf || a.team.name.localeCompare(b.team.name));
}

function TeamName({ team, myTeamIds, side = "left" }: { team: Team; myTeamIds: Set<string>; side?: "left"|"right" }) {
  const isMe = myTeamIds.has(team.id);
  return (
    <span className={`flex items-center gap-1.5 ${side === "right" ? "flex-row-reverse" : ""}`}>
      {team.flagUrl && <img src={team.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />}
      <span className={`font-medium text-sm truncate ${isMe ? "text-green-700 font-bold" : ""}`}>
        {team.name}
        {isMe && <span className="ml-1 text-[10px] text-green-500">★</span>}
      </span>
    </span>
  );
}

function MatchCard({ match, myTeamIds }: { match: MatchWithTeams; myTeamIds: Set<string> }) {
  const hasMyTeam = myTeamIds.has(match.homeTeam.id) || myTeamIds.has(match.awayTeam.id);
  const finished  = match.status === "FINISHED";
  const live      = match.status === "LIVE";

  return (
    <div className={`rounded-xl border p-3 ${hasMyTeam ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <TeamName team={match.homeTeam} myTeamIds={myTeamIds} />
        </div>
        <div className="flex-shrink-0 text-center w-16">
          {finished ? (
            <span className="font-mono font-bold text-gray-800 text-base">
              {match.homeScore}–{match.awayScore}
            </span>
          ) : live ? (
            <span className="text-xs font-bold text-green-600 animate-pulse">LIVE</span>
          ) : (
            <span className="text-xs text-gray-400">vs</span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex justify-end">
          <TeamName team={match.awayTeam} myTeamIds={myTeamIds} side="right" />
        </div>
      </div>
      {!finished && match.kickoff && (
        <p className="text-[10px] text-gray-400 text-center mt-1">
          {new Date(match.kickoff).toLocaleDateString(undefined, { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
        </p>
      )}
    </div>
  );
}

function GroupCard({ group, standings, matches, myTeamIds }: {
  group: string;
  standings: Standing[];
  matches: MatchWithTeams[];
  myTeamIds: Set<string>;
}) {
  const groupMatches = matches.filter(m =>
    m.stage === "Group Stage" &&
    (m.homeTeam.group === group || m.awayTeam.group === group)
  );

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <h3 className="font-bold text-sm text-gray-700">Group {group}</h3>
      </div>

      {/* Standings */}
      {standings.some(s => s.p > 0) && (
        <table className="w-full text-xs border-b border-gray-100">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left px-3 py-1.5 font-medium">Team</th>
              <th className="text-center px-1 py-1.5 font-medium w-6">P</th>
              <th className="text-center px-1 py-1.5 font-medium w-6">W</th>
              <th className="text-center px-1 py-1.5 font-medium w-6">D</th>
              <th className="text-center px-1 py-1.5 font-medium w-6">L</th>
              <th className="text-center px-1 py-1.5 font-medium w-8">GD</th>
              <th className="text-center px-2 py-1.5 font-medium w-8">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {standings.map((s, i) => {
              const isMe = myTeamIds.has(s.team.id);
              const qualified = i < 2;
              return (
                <tr key={s.team.id} className={isMe ? "bg-green-50" : ""}>
                  <td className="px-3 py-1.5 flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0
                      ${qualified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                      {i+1}
                    </span>
                    {s.team.flagUrl && <img src={s.team.flagUrl} alt="" className="w-4 h-2.5 object-cover rounded-sm" />}
                    <span className={`truncate font-medium ${isMe ? "text-green-700" : ""}`}>
                      {s.team.name}{isMe && " ★"}
                    </span>
                  </td>
                  <td className="text-center px-1 py-1.5 text-gray-500">{s.p}</td>
                  <td className="text-center px-1 py-1.5 text-gray-500">{s.w}</td>
                  <td className="text-center px-1 py-1.5 text-gray-500">{s.d}</td>
                  <td className="text-center px-1 py-1.5 text-gray-500">{s.l}</td>
                  <td className="text-center px-1 py-1.5 text-gray-500">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                  <td className="text-center px-2 py-1.5 font-bold">{s.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Matches */}
      <div className="p-3 space-y-2">
        {groupMatches.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">No matches yet</p>
        ) : (
          groupMatches.map(m => <MatchCard key={m.id} match={m} myTeamIds={myTeamIds} />)
        )}
      </div>
    </div>
  );
}

export default async function TournamentPage() {
  const session = await auth();

  const [matches, teams, userTeams] = await Promise.all([
    prisma.match.findMany({
      include: {
        homeTeam: { select: { id: true, name: true, tier: true, flagUrl: true, group: true } },
        awayTeam: { select: { id: true, name: true, tier: true, flagUrl: true, group: true } },
      },
      orderBy: { kickoff: "asc" },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    session ? prisma.userTeam.findMany({
      where: { userId: session.user.id },
      select: { teamId: true },
    }) : Promise.resolve([]),
  ]);

  const myTeamIds = new Set(userTeams.map(ut => ut.teamId));

  const totalFinished = matches.filter(m => m.status === "FINISHED").length;
  const totalLive     = matches.filter(m => m.status === "LIVE").length;
  const groupMatches  = matches.filter(m => m.stage === "Group Stage");
  const knockoutMatches = matches.filter(m => KNOCKOUT_STAGES.includes(m.stage));

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">WC 2026 Tournament</h1>
            <p className="text-gray-500 text-sm mt-1">
              {totalFinished} matches played · {totalLive > 0 ? `${totalLive} live · ` : ""}
              {matches.length - totalFinished - totalLive} scheduled
              {session && myTeamIds.size > 0 && (
                <span className="ml-2 text-green-600 font-medium">★ = your team</span>
              )}
            </p>
          </div>
        </div>

        {/* Group Stage */}
        <section>
          <h2 className="text-xl font-bold mb-5">Group Stage</h2>
          {groupMatches.length === 0 && (
            <p className="text-sm text-gray-400">No group stage matches entered yet.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {GROUPS.map(group => {
              const standings = calcGroupStandings(group, teams, matches);
              if (standings.length === 0) return null;
              return (
                <GroupCard
                  key={group}
                  group={group}
                  standings={standings}
                  matches={matches}
                  myTeamIds={myTeamIds}
                />
              );
            })}
          </div>
        </section>

        {/* Knockout */}
        <section>
          <h2 className="text-xl font-bold mb-5">Knockout Rounds</h2>
          {knockoutMatches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-3xl mb-3">🏆</p>
              <p className="text-gray-500 text-sm">Knockout matches will appear here once the group stage is complete.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {KNOCKOUT_STAGES.map(stage => {
                const stageMatches = knockoutMatches.filter(m => m.stage === stage);
                if (stageMatches.length === 0) return null;
                const isFinal = stage === "Final" || stage === "Third Place";
                return (
                  <div key={stage}>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      {stage === "Final" && "🏆 "}
                      {stage === "Third Place" && "🥉 "}
                      {stage}
                    </h3>
                    <div className={`grid gap-3 ${
                      isFinal ? "max-w-sm" :
                      stage === "Semi-final" ? "grid-cols-1 sm:grid-cols-2 max-w-2xl" :
                      stage === "Quarter-final" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
                      stage === "Round of 16" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
                      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    }`}>
                      {stageMatches.map(m => (
                        <MatchCard key={m.id} match={m} myTeamIds={myTeamIds} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
