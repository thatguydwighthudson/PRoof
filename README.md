# PRoof — Personal Workout PWA

Mobile-first workout tracker (Next.js App Router, TypeScript, Neon PostgreSQL, Drizzle ORM, Tailwind).

## Setup

1. **Database** — Schema and seed are in `sql/`. You’ve already run these against Neon.

2. **Environment** — Create `.env.local`:

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
CRON_SECRET=your-cron-secret
```

Generate VAPID keys: `npx web-push generate-vapid-keys`

3. **Install & run**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to **Today**.

## PWA (iPhone)

- Add to Home Screen from Safari
- `manifest.json` + `public/sw.js` for install and push
- Enable notifications in **Settings**

## Daily reminders (cron)

Hit `/api/cron/reminders` with `Authorization: Bearer $CRON_SECRET` on a schedule (e.g. Vercel Cron) at the user’s `workout_reminders.remind_time`.

## User

Single user: `CURRENT_USER_ID = 1` in `src/lib/config.ts`. No auth.

## Features

- Today tab: PPL 6-day program, deload weeks, weekly exercise rotation
- Active workout: sets, warm-ups, RPE, rest timer, PR badges, AI coach, plate calculator
- Progressive overload suggestions (stored in kg, displayed in lbs/kg)
- History + clone session
- Exercises library, AI chat, body check-in, data export (JSON/CSV)
