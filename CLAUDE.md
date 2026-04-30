# World Cup 2026 Sweepstakes

## Stack
- **Next.js 15** (App Router, TypeScript, Tailwind CSS)
- **Prisma 5** + PostgreSQL (Neon free tier)
- **NextAuth v5** (magic-link email via Resend)
- **Vercel** hosting + Cron Jobs for background sync

## Key files
| Path | Purpose |
|---|---|
| `prisma/schema.prisma` | Full DB schema |
| `prisma/seed.ts` | Seeds 48 WC teams + House account |
| `src/lib/auth.ts` | NextAuth config |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/draft.ts` | Draft algorithm |
| `src/lib/points.ts` | Points calculation constants |
| `src/lib/sports-api.ts` | API-Football wrapper |
| `src/app/api/cron/sync-scores/route.ts` | 15-min score sync cron |
| `vercel.json` | Cron schedule (*/15 * * * *) |

## Environment variables (see .env.example)
- `DATABASE_URL` — Neon Postgres connection string
- `AUTH_SECRET` — generate with `npx auth secret`
- `AUTH_RESEND_KEY` — Resend API key
- `EMAIL_FROM` — verified sender address
- `API_FOOTBALL_KEY` — API-Football key
- `CRON_SECRET` — random secret to protect cron endpoint

## Dev commands
```bash
npm run dev          # Start dev server
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed teams + House account
npm run db:studio    # Open Prisma Studio
npx auth secret      # Generate AUTH_SECRET
```

## Phases
- **Phase 0** (done) — Scaffold, schema, auth wiring
- **Phase 1** — Draft system (Admin UI + algorithm)
- **Phase 2** — User dashboard + leaderboard
- **Phase 3** — API sync + points engine
- **Phase 4** — Trading block
- **Phase 5** — Polish + launch
