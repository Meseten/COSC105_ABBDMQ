# PantryPal

A recipe-and-meal-planning web app for **COSC 105 - Intelligent Systems** at
Cavite State University Naic. List what is in your pantry, set servings, diet
rules, cuisine and a weekly peso budget, and Google Gemini drafts a day-by-day
meal plan plus a shopping list of the missing items. The Gemini key never
leaves the server. Saved plans live on a device shelf; signed-in users sync to
Supabase.

**What is inside**

- Plan drafting (breakfast / lunch / dinner per day), shopping-list checkboxes,
  peso totals, copy-back to the pantry, and per-plan print styles.
- Branded mark: an open pantry cabinet with a smiling jar (renders as favicon
  and header glyph; regenerate with `node scripts/make-icons.mjs`).
- **Chef Pan**, the on-call cooking assistant answering questions by chat.
- Accounts by email/password (and a Google button once the provider is
  enabled) via Supabase Auth; profiles with XP, levels, daily streaks and
  badges; XP is granted at most once per day, computed server-side.
- Community board: share plans, browse, search, like (like counts kept honest
  by database triggers), delete your own posts; moderation by
  `member / moderator / admin` roles enforced with row-level security
  (promote via SQL on `profiles.role`).
- Leaderboard of top cooks by XP.
- Realtime community chat room with optimistic sends.
- Light/dark theme with toasts and animations.
- Security headers (nosniff, frame-deny, referrer, permissions policy), rate
  limiting and input caps on AI routes, robots.txt and sitemap, a global error
  boundary, full Terms of Service and Privacy Policy (RA 10173-aligned).
- Dependency audit is clean (`npm audit`: 0 vulnerabilities); Next's nested
  `postcss` is pinned to the patched line (`^8.5.18`) via `overrides` in
  `package.json` because the advisory fix lands in Next 16 (breaking).
  Review the pin when Next is upgraded.
- Maintenance and ISO/IEC 25010 quality evidence: see `QUALITY.md`.
- Contact and data-protection requests (DPO): benjamesduag.edu@gmail.com.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router, TypeScript, React 19) + Tailwind CSS v4 |
| Backend | Next.js API routes (Node runtime) calling Gemini |
| LLM | Google Gemini via structured JSON output; model chain `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` → `gemini-3.8-flash` |
| Database | Supabase (PostgreSQL) with row-level security |
| Hosting | Vercel (single project, frontend + serverless API routes) |

The Gemini REST integration follows the official quickstart and structured
output docs: https://ai.google.dev/gemini-api/docs/get-started

## Run it locally

Requirements: Node 18.17+ and npm.

```bash
npm install
cp .env.example .env.local   # then fill in real values (see below)
npm run dev                  # http://localhost:3000
```

- `GEMINI_API_KEY`: from https://aistudio.google.com/apikey (required).
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: from your
  Supabase project's Settings > API (optional; without them the shelf works
  on-device only and cloud sync is skipped).

**Do not commit `.env.local`.** It is git-ignored already. Only `.env.example`
(the names, never values) goes in the repo.

## Supabase setup (once)

1. Create (or reuse) a Supabase project.
2. Open the SQL editor and run `supabase/migrations/0001_meal_plans.sql`.
3. Enable anonymous sign-ins: Authentication > Providers > Email > allow
   anonymous sign-ins.
4. Copy the project URL and anon key into `.env.local`.

Row-level security keeps every plan visible/writable only by the session that
created it.

## Deploy on Vercel

1. Push the repo to GitHub (no secrets anywhere).
2. Vercel > New Project > import the repo.
3. Framework preset: Next.js. Add the same three env vars in the project's
   Environment Variables (Vercel encrypts them).
4. Deploy. Vercel serves HTTPS by default, meeting the hosting requirement.

## Production commands

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Repository guide

```
src/app                 pages: home (planner), /saved (shelf), /community,
                        /community/chat, /assistant, /profile, /terms, /privacy
src/app/api             plan + assistant endpoints (server-only Gemini key)
src/components          form, plan view, masthead, brand mark, theme toggle
src/lib                 Gemini engine, plan validation/storage, auth, Supabase
supabase/migrations     SQL schema with RLS policies and RBAC (0001–0006)
scripts/make-icons.mjs  regenerates favicon + header icons from one SVG
DESIGN.md               design direction and tokens (with reasons)
PRD.md                  full product requirements document
QUALITY.md              ISO/IEC 25010 coverage with evidence
```
