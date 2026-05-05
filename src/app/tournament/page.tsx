import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import TournamentBracket from "./TournamentBracket";

export default async function TournamentPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [matches, teams, userTeams] = await Promise.all([
    prisma.match.findMany({
      include: {
        homeTeam: { select: { id: true, name: true, tier: true, flagUrl: true, group: true } },
        awayTeam: { select: { id: true, name: true, tier: true, flagUrl: true, group: true } },
      },
      orderBy: { kickoff: "asc" },
    }),
    prisma.team.findMany({ orderBy: { group: "asc" } }),
    session
      ? prisma.userTeam.findMany({ where: { userId: session.user.id }, select: { teamId: true } })
      : Promise.resolve([]),
  ]);

  const myTeamIds = new Set(userTeams.map((ut) => ut.teamId));

  return (
    <>
      <Navbar />
      <TournamentBracket
        matches={matches.map((m) => ({
          ...m,
          kickoff: m.kickoff.toISOString(),
        }))}
        teams={teams}
        myTeamIds={Array.from(myTeamIds)}
        isAdmin={isAdmin}
      />
    </>
  );
}
