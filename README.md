# ShiftSense

**AI-assisted workforce planning for restaurants, cafés, and hotels.**

ShiftSense forecasts hourly demand (covers and orders), converts that into role-level headcount using ratios you control, drafts a weekly roster, and lets managers accept, edit, or ignore each staffing gap. Headcount math is deterministic; Gemini is used only for explanations, briefings, and parsing event notes—not for inventing numbers.

**Live demo:** [hackathon-2-sandhya-ginare.vercel.app](https://hackathon-2-sandhya-ginare.vercel.app)

---

## What it does

| Area | What you get |
| --- | --- |
| **Dashboard** | Seven-day demand view, open alerts, AI week briefing (when Gemini is configured) |
| **Forecast** | Hourly WCMA predictions with weather and holiday drivers |
| **Staffing** | Matrix of required vs scheduled staff by role and hour; tap a cell for an AI or template explanation |
| **Roster** | Named shifts for the week; rebuild after team or role changes |
| **Team** | Add people, roles, and weekly hour caps |
| **Roles** | Enable/disable roles or add custom ones; ratios drive headcount |
| **Events** | Manual events or paste a note (optional Gemini parse); triggers replan |
| **Approvals** | Human-in-the-loop on staffing recommendations |
| **Import** | CSV sales and reservations |

External signals: **Open-Meteo** (weather), **date-holidays** (public holidays by venue country), plus manager-entered events.

---

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Data:** Supabase Postgres (optional) or in-memory **demo** mode with signed session cookies for Vercel
- **Forecast:** Weighted cyclical moving average (WCMA), ~8 weeks of history
- **AI (optional):** Google Gemini via `GEMINI_API_KEY`

---

## Quick start

```bash
git clone https://github.com/sandhyawebd26/hackathon-2-sandhya-ginare.git
cd hackathon-2-sandhya-ginare
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and use the ops console at `/dashboard`. **Demo mode works without Supabase.**

Production build:

```bash
npm run build
npm start
```

---

## Environment variables

Copy `.env.example` to `.env.local` for local development. On **Vercel**, set the same keys for **Production** (not Preview only).

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATA_SOURCE` | Yes (prod) | `demo` (default) or `supabase` |
| `CRON_SECRET` or `SESSION_SECRET` | Yes (prod demo) | Signs demo session cookies on serverless; protects cron routes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase mode | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase mode | Client anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase mode | Server-side writes |
| `GEMINI_API_KEY` | No | AI explanations, briefings, event-note parsing; templates used if unset |

**Vercel note:** Integration env names like `SUPABASE_URL` are not read by this app—you need the `NEXT_PUBLIC_*` names above.

---

## Demo vs Supabase

### Demo (`DATA_SOURCE=demo`)

- Accounts, venues, team, roles, events, and approval overrides persist in a **gzip-compressed signed cookie** so cold starts on Vercel still work.
- Sales history and forecasts are re-seeded in memory; CSV import history is not stored in the cookie.
- Set **`CRON_SECRET`** (or **`SESSION_SECRET`**) on Production or sessions will fail after signup.

### Supabase (`DATA_SOURCE=supabase`)

1. Create a Supabase project and run migrations in order:
   - `supabase/migrations/20261029120000_shiftsense.sql`
   - `supabase/migrations/20261029143000_role_catalog.sql`
2. Set all Supabase env vars and `DATA_SOURCE=supabase`.
3. Wire Supabase Auth + `profiles` for production signup (demo auth remains in-memory today).

Sample CSVs: `public/demo/sales-sample.csv`, `public/demo/reservations-sample.csv`.

---

## Deployment (Vercel)

- Connect the repo; deploy branch **`develop`** (or your chosen production branch).
- Set env vars for **Production**.
- Cron routes (optional): `/api/cron/sync-weather`, `/api/cron/forecast-nightly` with `Authorization: Bearer <CRON_SECRET>`.

---

## Project layout

```
src/app/              Routes (marketing, auth, ops, API)
src/components/       UI (ops console, marketing, brand)
src/server/           Forecast pipeline, stores, auth, Gemini
supabase/migrations/  Postgres schema
public/landing/       Marketing photography
public/staff/         Team imagery for landing and avatars
```

---

## Privacy

Demo data uses minimal staff fields (names and roles only). For a real venue, define retention, consent, and a DPA under applicable law (e.g. India DPDP, EU GDPR). This repository is not legal advice.

---

## License

Private / hackathon project unless otherwise specified by the repository owner.
