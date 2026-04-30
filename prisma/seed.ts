import { PrismaClient, Tier } from "@prisma/client";

const prisma = new PrismaClient();

// 48 World Cup 2026 teams across 4 tiers based on FIFA world rankings
// Tier S (8)  — Elite favourites,     value = 4
// Tier A (12) — Strong contenders,    value = 3
// Tier B (16) — Solid mid-field,      value = 2
// Tier C (12) — Underdogs,            value = 1
const teams: { name: string; country: string; tier: Tier; group: string; flagUrl: string }[] = [
  // ── Tier S — Elite (8) ───────────────────────────────────────────
  { name: "Argentina",   country: "Argentina",   tier: Tier.S, group: "A", flagUrl: "https://flagcdn.com/ar.svg" },
  { name: "France",      country: "France",      tier: Tier.S, group: "B", flagUrl: "https://flagcdn.com/fr.svg" },
  { name: "England",     country: "England",     tier: Tier.S, group: "C", flagUrl: "https://flagcdn.com/gb-eng.svg" },
  { name: "Brazil",      country: "Brazil",      tier: Tier.S, group: "D", flagUrl: "https://flagcdn.com/br.svg" },
  { name: "Spain",       country: "Spain",       tier: Tier.S, group: "E", flagUrl: "https://flagcdn.com/es.svg" },
  { name: "Germany",     country: "Germany",     tier: Tier.S, group: "F", flagUrl: "https://flagcdn.com/de.svg" },
  { name: "Portugal",    country: "Portugal",    tier: Tier.S, group: "G", flagUrl: "https://flagcdn.com/pt.svg" },
  { name: "Netherlands", country: "Netherlands", tier: Tier.S, group: "H", flagUrl: "https://flagcdn.com/nl.svg" },

  // ── Tier A — Contenders (12) ──────────────────────────────────────
  { name: "Belgium",     country: "Belgium",     tier: Tier.A, group: "I", flagUrl: "https://flagcdn.com/be.svg" },
  { name: "Uruguay",     country: "Uruguay",     tier: Tier.A, group: "J", flagUrl: "https://flagcdn.com/uy.svg" },
  { name: "Croatia",     country: "Croatia",     tier: Tier.A, group: "K", flagUrl: "https://flagcdn.com/hr.svg" },
  { name: "USA",         country: "United States", tier: Tier.A, group: "L", flagUrl: "https://flagcdn.com/us.svg" },
  { name: "Colombia",    country: "Colombia",    tier: Tier.A, group: "A", flagUrl: "https://flagcdn.com/co.svg" },
  { name: "Morocco",     country: "Morocco",     tier: Tier.A, group: "B", flagUrl: "https://flagcdn.com/ma.svg" },
  { name: "Japan",       country: "Japan",       tier: Tier.A, group: "C", flagUrl: "https://flagcdn.com/jp.svg" },
  { name: "Denmark",     country: "Denmark",     tier: Tier.A, group: "D", flagUrl: "https://flagcdn.com/dk.svg" },
  { name: "Switzerland", country: "Switzerland", tier: Tier.A, group: "E", flagUrl: "https://flagcdn.com/ch.svg" },
  { name: "Serbia",      country: "Serbia",      tier: Tier.A, group: "F", flagUrl: "https://flagcdn.com/rs.svg" },
  { name: "Poland",      country: "Poland",      tier: Tier.A, group: "G", flagUrl: "https://flagcdn.com/pl.svg" },
  { name: "Mexico",      country: "Mexico",      tier: Tier.A, group: "H", flagUrl: "https://flagcdn.com/mx.svg" },

  // ── Tier B — Solid (16) ───────────────────────────────────────────
  { name: "South Korea",     country: "South Korea",  tier: Tier.B, group: "I", flagUrl: "https://flagcdn.com/kr.svg" },
  { name: "Australia",       country: "Australia",    tier: Tier.B, group: "J", flagUrl: "https://flagcdn.com/au.svg" },
  { name: "Ecuador",         country: "Ecuador",      tier: Tier.B, group: "K", flagUrl: "https://flagcdn.com/ec.svg" },
  { name: "Senegal",         country: "Senegal",      tier: Tier.B, group: "L", flagUrl: "https://flagcdn.com/sn.svg" },
  { name: "Turkey",          country: "Turkey",       tier: Tier.B, group: "A", flagUrl: "https://flagcdn.com/tr.svg" },
  { name: "Austria",         country: "Austria",      tier: Tier.B, group: "B", flagUrl: "https://flagcdn.com/at.svg" },
  { name: "Ukraine",         country: "Ukraine",      tier: Tier.B, group: "C", flagUrl: "https://flagcdn.com/ua.svg" },
  { name: "Egypt",           country: "Egypt",        tier: Tier.B, group: "D", flagUrl: "https://flagcdn.com/eg.svg" },
  { name: "Chile",           country: "Chile",        tier: Tier.B, group: "E", flagUrl: "https://flagcdn.com/cl.svg" },
  { name: "Iran",            country: "Iran",         tier: Tier.B, group: "F", flagUrl: "https://flagcdn.com/ir.svg" },
  { name: "Canada",          country: "Canada",       tier: Tier.B, group: "G", flagUrl: "https://flagcdn.com/ca.svg" },
  { name: "Tunisia",         country: "Tunisia",      tier: Tier.B, group: "H", flagUrl: "https://flagcdn.com/tn.svg" },
  { name: "Nigeria",         country: "Nigeria",      tier: Tier.B, group: "I", flagUrl: "https://flagcdn.com/ng.svg" },
  { name: "Czech Republic",  country: "Czech Republic", tier: Tier.B, group: "J", flagUrl: "https://flagcdn.com/cz.svg" },
  { name: "Hungary",         country: "Hungary",      tier: Tier.B, group: "K", flagUrl: "https://flagcdn.com/hu.svg" },
  { name: "Venezuela",       country: "Venezuela",    tier: Tier.B, group: "L", flagUrl: "https://flagcdn.com/ve.svg" },

  // ── Tier C — Underdogs (12) ───────────────────────────────────────
  { name: "Saudi Arabia",  country: "Saudi Arabia",  tier: Tier.C, group: "A", flagUrl: "https://flagcdn.com/sa.svg" },
  { name: "Costa Rica",    country: "Costa Rica",    tier: Tier.C, group: "B", flagUrl: "https://flagcdn.com/cr.svg" },
  { name: "New Zealand",   country: "New Zealand",   tier: Tier.C, group: "C", flagUrl: "https://flagcdn.com/nz.svg" },
  { name: "Ghana",         country: "Ghana",         tier: Tier.C, group: "D", flagUrl: "https://flagcdn.com/gh.svg" },
  { name: "Albania",       country: "Albania",       tier: Tier.C, group: "E", flagUrl: "https://flagcdn.com/al.svg" },
  { name: "Bolivia",       country: "Bolivia",       tier: Tier.C, group: "F", flagUrl: "https://flagcdn.com/bo.svg" },
  { name: "Panama",        country: "Panama",        tier: Tier.C, group: "G", flagUrl: "https://flagcdn.com/pa.svg" },
  { name: "Iraq",          country: "Iraq",          tier: Tier.C, group: "H", flagUrl: "https://flagcdn.com/iq.svg" },
  { name: "Paraguay",      country: "Paraguay",      tier: Tier.C, group: "I", flagUrl: "https://flagcdn.com/py.svg" },
  { name: "Cameroon",      country: "Cameroon",      tier: Tier.C, group: "J", flagUrl: "https://flagcdn.com/cm.svg" },
  { name: "Slovenia",      country: "Slovenia",      tier: Tier.C, group: "K", flagUrl: "https://flagcdn.com/si.svg" },
  { name: "Jamaica",       country: "Jamaica",       tier: Tier.C, group: "L", flagUrl: "https://flagcdn.com/jm.svg" },
];

async function main() {
  console.log("Seeding 48 teams...");
  for (const team of teams) {
    await prisma.team.upsert({
      where: { name: team.name },
      update: { tier: team.tier, group: team.group, flagUrl: team.flagUrl },
      create: team,
    });
  }
  console.log(`Seeded ${teams.length} teams.`);

  await prisma.gameState.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

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
