# Time Lost Calls

> How much of your life are meetings stealing? Drop your calendar, get the brutally honest answer.

A submission for the **Vercel Time Lost Calls** contest.

## What it does

Upload your Google Calendar `.ics` export (or click "demo data") and get an instant audit of:

- Total time spent in meetings over the last 30 days
- How much of that time was probably wasted (heuristic engagement score)
- The cost in real money, based on your hourly rate
- Top recurring time wasters (standups, all-hands, status syncs)
- Concrete escape routes (async standups, Loom recordings, declining 15+ person meetings)

No login. No database. Your calendar file is parsed in memory and immediately forgotten.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript, Tailwind CSS v4
- shadcn/ui (new-york, dark mode)
- ical.js for `.ics` parsing
- Deployed on Vercel (Fluid Compute)

## Heuristic

For each meeting, an "engagement score" (0–100) is computed from:

- Attendee count (1:1 → high, 20+ → very low)
- Recurring vs one-off (recurring penalized as autopilot)
- Duration (>90 min penalized for diminishing returns)
- Title-based category (standup, all-hands, 1:1, deep-dive, status, external)

Waste minutes = duration × (1 − engagementScore/100). Cost = waste hours × hourly rate.

## Run locally

```bash
npm install
npm run dev
```

## Routes

- `/` — landing
- `/dashboard` — report (reads session storage populated from landing)
- `/api/parse-ics` — POST `multipart/form-data` with `.ics` file → JSON meetings
