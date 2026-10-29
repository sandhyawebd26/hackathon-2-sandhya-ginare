# ShiftSense

AI workforce planning for hospitality. The app forecasts hourly covers, turns them into role-level headcount, and keeps a manager in the loop.

The interface follows the editorial hotel language of [Augustine](https://augustine.qodeinteractive.com/): a light ivory house style and a dark “hotel night” style. Use the Light / Dark switch in the header. The choice is stored in the browser.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS 4
- Supabase Postgres, Auth, and Storage (`supabase/migrations`)
- New accounts keep their venue, team, and roster in memory when `DATA_SOURCE=demo`
- Forecast: weighted cyclical moving average, plus Open-Meteo, `date-holidays`, and manual events
- Explanations: Gemini when `GEMINI_API_KEY` is set, otherwise a template built from the same drivers

Headcount is never taken from the language model.

See [docs/SIGNALS_AND_AI.md](docs/SIGNALS_AND_AI.md) for weather (`Open-Meteo`), holidays (`date-holidays`), events, WCMA forecast, and Gemini use cases.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The floor plan at `/dashboard` works without Supabase keys.

## Environment

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and cookie auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server writes when `DATA_SOURCE=supabase` |
| `GEMINI_API_KEY` | Optional. Google AI Studio free tier |
| `CRON_SECRET` | Protects `/api/cron/*` in production |
| `DATA_SOURCE` | `demo` (default) or `supabase` |

Apply `supabase/migrations/20261029120000_shiftsense.sql`, then `supabase/seed.sql`, in the Supabase SQL editor. After a manager signs up, insert a `profiles` row for their auth user and organization. Set `DATA_SOURCE=supabase`.

Sample CSV files live in `public/demo/`.

## Privacy

Keep staff detail minimal. The demo uses first names only. Retention and a DPA are an operational step for a real venue, including India’s DPDP and the EU GDPR. This repository is not legal advice.
