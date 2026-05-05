import { PrismaClient, Tier } from "@prisma/client";

const prisma = new PrismaClient();

// Actual WC 2026 draw — 48 teams in 12 groups (A–L)
// Tier S (8)  — Elite favourites
// Tier A (12) — Strong contenders
// Tier B (16) — Solid mid-field
// Tier C (12) — Underdogs
const teams: { name: string; country: string; tier: Tier; group: string; flagUrl: string }[] = [
  // ── Group A ──────────────────────────────────────────────────────────
  { name: "Mexico",        country: "Mexico",        tier: Tier.A, group: "A", flagUrl: "https://flagcdn.com/mx.svg" },
  { name: "South Africa",  country: "South Africa",  tier: Tier.C, group: "A", flagUrl: "https://flagcdn.com/za.svg" },
  { name: "Korea Republic",country: "South Korea",   tier: Tier.A, group: "A", flagUrl: "https://flagcdn.com/kr.svg" },
  { name: "Czechia",       country: "Czech Republic",tier: Tier.B, group: "A", flagUrl: "https://flagcdn.com/cz.svg" },

  // ── Group B ──────────────────────────────────────────────────────────
  { name: "Canada",               country: "Canada",              tier: Tier.B, group: "B", flagUrl: "https://flagcdn.com/ca.svg" },
  { name: "Bosnia & Herzegovina", country: "Bosnia & Herzegovina",tier: Tier.C, group: "B", flagUrl: "https://flagcdn.com/ba.svg" },
  { name: "Qatar",                country: "Qatar",               tier: Tier.C, group: "B", flagUrl: "https://flagcdn.com/qa.svg" },
  { name: "Switzerland",          country: "Switzerland",         tier: Tier.A, group: "B", flagUrl: "https://flagcdn.com/ch.svg" },

  // ── Group C ──────────────────────────────────────────────────────────
  { name: "Brazil",   country: "Brazil",  tier: Tier.S, group: "C", flagUrl: "https://flagcdn.com/br.svg" },
  { name: "Morocco",  country: "Morocco", tier: Tier.A, group: "C", flagUrl: "https://flagcdn.com/ma.svg" },
  { name: "Haiti",    country: "Haiti",   tier: Tier.C, group: "C", flagUrl: "https://flagcdn.com/ht.svg" },
  { name: "Scotland", country: "Scotland",tier: Tier.B, group: "C", flagUrl: "https://flagcdn.com/gb-sct.svg" },

  // ── Group D ──────────────────────────────────────────────────────────
  { name: "USA",      country: "United States",tier: Tier.A, group: "D", flagUrl: "https://flagcdn.com/us.svg" },
  { name: "Paraguay", country: "Paraguay",     tier: Tier.C, group: "D", flagUrl: "https://flagcdn.com/py.svg" },
  { name: "Australia",country: "Australia",    tier: Tier.B, group: "D", flagUrl: "https://flagcdn.com/au.svg" },
  { name: "Türkiye",  country: "Turkey",       tier: Tier.B, group: "D", flagUrl: "https://flagcdn.com/tr.svg" },

  // ── Group E ──────────────────────────────────────────────────────────
  { name: "Germany",       country: "Germany",      tier: Tier.S, group: "E", flagUrl: "https://flagcdn.com/de.svg" },
  { name: "Curaçao",       country: "Curaçao",      tier: Tier.C, group: "E", flagUrl: "https://flagcdn.com/cw.svg" },
  { name: "Côte d'Ivoire", country: "Ivory Coast",  tier: Tier.B, group: "E", flagUrl: "https://flagcdn.com/ci.svg" },
  { name: "Ecuador",       country: "Ecuador",      tier: Tier.A, group: "E", flagUrl: "https://flagcdn.com/ec.svg" },

  // ── Group F ──────────────────────────────────────────────────────────
  { name: "Netherlands", country: "Netherlands",tier: Tier.S, group: "F", flagUrl: "https://flagcdn.com/nl.svg" },
  { name: "Japan",       country: "Japan",      tier: Tier.A, group: "F", flagUrl: "https://flagcdn.com/jp.svg" },
  { name: "Sweden",      country: "Sweden",     tier: Tier.B, group: "F", flagUrl: "https://flagcdn.com/se.svg" },
  { name: "Tunisia",     country: "Tunisia",    tier: Tier.B, group: "F", flagUrl: "https://flagcdn.com/tn.svg" },

  // ── Group G ──────────────────────────────────────────────────────────
  { name: "Belgium",    country: "Belgium",    tier: Tier.A, group: "G", flagUrl: "https://flagcdn.com/be.svg" },
  { name: "Egypt",      country: "Egypt",      tier: Tier.B, group: "G", flagUrl: "https://flagcdn.com/eg.svg" },
  { name: "IR Iran",    country: "Iran",       tier: Tier.C, group: "G", flagUrl: "https://flagcdn.com/ir.svg" },
  { name: "New Zealand",country: "New Zealand",tier: Tier.C, group: "G", flagUrl: "https://flagcdn.com/nz.svg" },

  // ── Group H ──────────────────────────────────────────────────────────
  { name: "Spain",      country: "Spain",      tier: Tier.S, group: "H", flagUrl: "https://flagcdn.com/es.svg" },
  { name: "Cabo Verde", country: "Cape Verde", tier: Tier.C, group: "H", flagUrl: "https://flagcdn.com/cv.svg" },
  { name: "Saudi Arabia",country:"Saudi Arabia",tier: Tier.B, group: "H", flagUrl: "https://flagcdn.com/sa.svg" },
  { name: "Uruguay",    country: "Uruguay",    tier: Tier.A, group: "H", flagUrl: "https://flagcdn.com/uy.svg" },

  // ── Group I ──────────────────────────────────────────────────────────
  { name: "France",  country: "France", tier: Tier.S, group: "I", flagUrl: "https://flagcdn.com/fr.svg" },
  { name: "Senegal", country: "Senegal",tier: Tier.A, group: "I", flagUrl: "https://flagcdn.com/sn.svg" },
  { name: "Iraq",    country: "Iraq",   tier: Tier.B, group: "I", flagUrl: "https://flagcdn.com/iq.svg" },
  { name: "Norway",  country: "Norway", tier: Tier.B, group: "I", flagUrl: "https://flagcdn.com/no.svg" },

  // ── Group J ──────────────────────────────────────────────────────────
  { name: "Argentina",country: "Argentina",tier: Tier.S, group: "J", flagUrl: "https://flagcdn.com/ar.svg" },
  { name: "Algeria",  country: "Algeria", tier: Tier.B, group: "J", flagUrl: "https://flagcdn.com/dz.svg" },
  { name: "Austria",  country: "Austria", tier: Tier.B, group: "J", flagUrl: "https://flagcdn.com/at.svg" },
  { name: "Jordan",   country: "Jordan",  tier: Tier.C, group: "J", flagUrl: "https://flagcdn.com/jo.svg" },

  // ── Group K ──────────────────────────────────────────────────────────
  { name: "Portugal",  country: "Portugal", tier: Tier.S, group: "K", flagUrl: "https://flagcdn.com/pt.svg" },
  { name: "Congo DR",  country: "Congo DR", tier: Tier.C, group: "K", flagUrl: "https://flagcdn.com/cd.svg" },
  { name: "Uzbekistan",country: "Uzbekistan",tier: Tier.C, group: "K", flagUrl: "https://flagcdn.com/uz.svg" },
  { name: "Colombia",  country: "Colombia", tier: Tier.A, group: "K", flagUrl: "https://flagcdn.com/co.svg" },

  // ── Group L ──────────────────────────────────────────────────────────
  { name: "England", country: "England",tier: Tier.S, group: "L", flagUrl: "https://flagcdn.com/gb-eng.svg" },
  { name: "Croatia", country: "Croatia",tier: Tier.A, group: "L", flagUrl: "https://flagcdn.com/hr.svg" },
  { name: "Ghana",   country: "Ghana",  tier: Tier.B, group: "L", flagUrl: "https://flagcdn.com/gh.svg" },
  { name: "Panama",  country: "Panama", tier: Tier.B, group: "L", flagUrl: "https://flagcdn.com/pa.svg" },
];

async function main() {
  console.log("Clearing old teams and draft data...");
  await prisma.$transaction([
    prisma.userTeam.deleteMany({}),
    prisma.trade.deleteMany({}),
  ]);
  await prisma.team.deleteMany({});

  await prisma.gameState.upsert({
    where: { id: "singleton" },
    update: { draftDone: false, draftAt: null },
    create: { id: "singleton" },
  });

  console.log("Seeding 48 WC 2026 teams...");
  for (const team of teams) {
    await prisma.team.create({ data: team });
  }
  console.log(`Seeded ${teams.length} teams.`);

  await prisma.user.upsert({
    where: { email: "house@sweepstakes.internal" },
    update: {},
    create: { email: "house@sweepstakes.internal", name: "House", role: "USER", isHouse: true },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
