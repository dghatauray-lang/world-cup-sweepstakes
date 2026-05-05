import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// WC 2026 Group Stage fixtures
// MD1: June 11-16 | MD2: June 17-22 | MD3: June 23-27
// Each group: [T1, T2, T3, T4] → MD1: 1v2, 3v4 | MD2: 1v3, 2v4 | MD3: 1v4, 2v3
const GROUP_FIXTURES: { group: string; teams: [string, string, string, string]; dates: [string, string, string] }[] = [
  { group: "A", teams: ["Mexico", "South Africa", "Korea Republic", "Czechia"],              dates: ["2026-06-11", "2026-06-17", "2026-06-23"] },
  { group: "B", teams: ["Canada", "Switzerland", "Qatar", "Bosnia & Herzegovina"],           dates: ["2026-06-12", "2026-06-17", "2026-06-23"] },
  { group: "C", teams: ["Brazil", "Morocco", "Scotland", "Haiti"],                           dates: ["2026-06-12", "2026-06-18", "2026-06-24"] },
  { group: "D", teams: ["USA", "Australia", "Paraguay", "Türkiye"],                          dates: ["2026-06-12", "2026-06-18", "2026-06-24"] },
  { group: "E", teams: ["Germany", "Ecuador", "Côte d'Ivoire", "Curaçao"],                   dates: ["2026-06-13", "2026-06-19", "2026-06-25"] },
  { group: "F", teams: ["Netherlands", "Japan", "Sweden", "Tunisia"],                        dates: ["2026-06-13", "2026-06-19", "2026-06-25"] },
  { group: "G", teams: ["Belgium", "Egypt", "IR Iran", "New Zealand"],                       dates: ["2026-06-14", "2026-06-20", "2026-06-26"] },
  { group: "H", teams: ["Spain", "Uruguay", "Saudi Arabia", "Cabo Verde"],                   dates: ["2026-06-14", "2026-06-20", "2026-06-26"] },
  { group: "I", teams: ["France", "Senegal", "Norway", "Iraq"],                              dates: ["2026-06-15", "2026-06-21", "2026-06-26"] },
  { group: "J", teams: ["Argentina", "Algeria", "Austria", "Jordan"],                        dates: ["2026-06-15", "2026-06-21", "2026-06-27"] },
  { group: "K", teams: ["Portugal", "Colombia", "Uzbekistan", "Congo DR"],                   dates: ["2026-06-16", "2026-06-22", "2026-06-27"] },
  { group: "L", teams: ["England", "Croatia", "Ghana", "Panama"],                            dates: ["2026-06-16", "2026-06-22", "2026-06-27"] },
];

// Kickoff times per matchday slot (UTC): two games per slot
const TIMES = [
  ["19:00", "22:00"],  // MD1 pair
  ["19:00", "22:00"],  // MD2 pair
  ["19:00", "22:00"],  // MD3 pair (concurrent for fairness)
];

async function main() {
  console.log("Clearing existing matches...");
  await prisma.match.deleteMany({});

  const allTeams = await prisma.team.findMany();
  const teamMap = new Map(allTeams.map((t) => [t.name, t.id]));

  let created = 0;

  for (const { teams, dates } of GROUP_FIXTURES) {
    const [t1, t2, t3, t4] = teams;
    const matchups: { home: string; away: string; dateIdx: number; timeIdx: number }[] = [
      // Matchday 1
      { home: t1, away: t2, dateIdx: 0, timeIdx: 0 },
      { home: t3, away: t4, dateIdx: 0, timeIdx: 1 },
      // Matchday 2
      { home: t1, away: t3, dateIdx: 1, timeIdx: 0 },
      { home: t2, away: t4, dateIdx: 1, timeIdx: 1 },
      // Matchday 3 (concurrent)
      { home: t1, away: t4, dateIdx: 2, timeIdx: 0 },
      { home: t2, away: t3, dateIdx: 2, timeIdx: 1 },
    ];

    for (const m of matchups) {
      const homeId = teamMap.get(m.home);
      const awayId = teamMap.get(m.away);
      if (!homeId) { console.warn(`Team not found: ${m.home}`); continue; }
      if (!awayId) { console.warn(`Team not found: ${m.away}`); continue; }

      const kickoff = new Date(`${dates[m.dateIdx]}T${TIMES[m.dateIdx][m.timeIdx]}:00Z`);

      await prisma.match.create({
        data: {
          homeTeamId: homeId,
          awayTeamId: awayId,
          stage: "Group Stage",
          kickoff,
          status: "SCHEDULED",
          homeScore: null,
          awayScore: null,
        },
      });
      created++;
    }
  }

  console.log(`Created ${created} group stage fixtures.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
