# PantryPal: Product Requirements Document

**Recipe and Meal Planning Assistant (PWA)** for COSC 105, Intelligent
Systems, Cavite State University Naic.

---

## 1. Executive Summary

PantryPal turns the question every student household knows ("What can I cook
with what's already in my pantry?") into a working answer. The user lists the
ingredients they own, their servings, diet rules, cuisine preference, and a
weekly grocery budget in pesos. The app calls Google Gemini through its own
server and returns: a day-by-day meal plan with per-dish steps, and a shopping
list of only the items still missing. Plans can be saved to a personal shelf
and every saved plan stays readable offline, like a well-thumbed recipe
notebook.

The project type ("Recipe and Meal Planning Assistant") follows the COSC 105
application list: users enter available ingredients, food preferences, budget,
and meal requirements; the app generates a meal plan and shopping list. All
minimum key functionalities are real, not mocked.

## 2. Goals and Non-Goals

Goals:

- Every required minimum functionality works end to end with a live LLM call.
- PWA is fully installable, has a service worker with real caching strategies,
  and shelters the user's saved plans from losing connection.
- API keys are server-only. Nothing sensitive ships in any bundle or commit.
- The design feels like PantryPal, with its own identity (editorial
  kitchen-journal voice), not like a generic template.

Non-goals (v1): multi-user accounts with passwords, nutrition databases with
verified calorie/price data, barcode scanning. Cost figures are clearly
labeled AI estimates, never presented as verified prices.

## 3. Users and Key Scenarios

Primary user: a Filipino student or small household with a partial pantry,
limited food budget, and true meal fatigue. Secondary: class panel for the
live demo.

Scenarii covered by the feature list:

1. **Pantry-first planning.** "I have rice, eggs, garlic, onion, tomatoes and
   chicken." Seven days, three meals, budget 1500. PantryPal gives a plan
   anchored on those items and a short shopping list.
2. **Budget reality check.** The plan says plainly whether the shopping list
   fits the budget, marked as an estimate.
3. **Diet and avoidance.** Halal/vegetarian/vegan/no-pork rules and dislike
   lists are respected in every dish.
4. **The store aisle.** Tick items off while shopping; struck items stay
   struck.
5. **Weak-signal day.** Bored in a hallway with one bar of data: open the app
   from the home screen, view saved plans and the last generated plan. Only
   new generation waits for internet.
6. **Device change.** The cloud shelf (Supabase) restores the plan library on
   a new device when signed back into the same anonymous session.

## 4. Functional Requirements

### 4.1 Planning form (home)

- Ingredients tag field (add by Enter/comma, up to 60).
- Avoid list (tag field, up to 30).
- Servings (1 to 12), days to plan (1 to 7), meals per day (1 to 3).
- Optional weekly grocery budget in PHP, optional household notes (max 500
  chars), diet rules and cuisine preference dropdowns.
- Validation client-side and re-validated server-side.

### 4.2 LLM planning pipeline (`POST /api/plan`)

- Input parsed and bounded server-side (lengths, numeric ranges).
- Cooldown per IP (5 s) so class demos cannot stampede the key.
- System prompt encodes Filipino-household rules: pantry-first usage, diet
  respect, dish repetition limits, beginner-level steps, realistic quantities,
  honest budget verdict.
- Gemini call uses structured JSON output (`responseSchema`) plus a light
  thinking budget, so the response parses reliably; a code-fence rescue handles
  strayed formats; `parsePlanResult` validates shape and clamps sizes before
  the JSON reaches the UI.
- Failures map to honest UI states: missing key (503, setup instructions in
  copy), rate limit (429), upstream trouble (502 with the reason), offline
  (client detects and offers the shelf).

### 4.3 Plan display

- Index-card day tabs (keyboard-operable, `tablist` semantics).
- Per meal: type and prep time, description, 3 to 5 numbered steps, pantry
  items it uses.
- Shopping list grouped by category with strike-through ticks and a cart
  counter.
- Budget verdict labeled as an AI estimate.
- "Cook's notes": leftovers, substitutions, prep-ahead tips.

### 4.4 Shelf (saved plans)

- localStorage is the source of truth (works offline); Supabase is a
  best-effort mirror.
- Two-way sync when online (push locally-only rows, pull cloud rows, basic
  shape checks before trusting remote data).
- Delete works locally and remotely. Empty/loading/error states are real copy,
  not skeletons.

### 4.5 PWA suite

- **Web app manifest**: name, standalone display, theme colors, 192/512 and
  maskable icons; installable per Chromium and Safari criteria.
- **Service worker**: versioned caches; network-first navigation with cache
  and `/offline` fallbacks; cache-first for immutable assets; runtime cache
  for other GETs; `skipWaiting` message channel.
- **Install prompt** surfaces when the browser offers it (`beforeinstallprompt`)
  and hides once standalone.
- **Responsive design**: mobile-first layout that scales to desktop, verified
  at narrow phone widths through 1120 px content.
- **HTTPS hosting** on Vercel (or the deployed Netlify/equivalent host signed
  by HTTPS by default).

## 5. Architecture

- **Frontend and backend**: single Next.js (App Router) codebase, TypeScript,
  Tailwind CSS v4. React 19.
- **Secrete-free API design**: the browser posts the pantry to `/api/plan`;
  only the Node runtime route reads `GEMINI_API_KEY` and talks to Google's
  endpoint. The key never reaches the client bundle.
- **Database**: Supabase (PostgreSQL) with anonymous sessions and row-level
  security. Schema in `supabase/migrations/0001_meal_plans.sql`.
- **Fonts**: Fraunces (display) and Atkinson Hyperlegible (body) via
  `next/font`, self-hosted at build time.
- **Hosting**: Vercel for both frontend and API routes; Supabase project is
  cloud-only.

## 6. Security, Privacy, Responsible AI

- Keys only in environment variables; `.env.example` carries names alone.
- Per-IP cooldown bounded.
- Supabase RLS restricts rows to the session owner (`auth.uid() = user_id`);
  anon publishable credentials only.
- Responsible AI: AI output is clearly attributed ("AI-generated; read a
  recipe fully before cooking"), budget figures labeled as estimates, no
  fabricated statistics or testimonials anywhere in the UI; refusal states
  when the service cannot reach Gemini.

## 7. Rubric Alignment (COSC 105, 100 pts)

| Criterion | How PantryPal scores "Excellent" |
|---|---|
| Web design & UI (20) | Distinct editorial kitchen-journal identity, full light/dark modes with verified contrast, mobile-first responsiveness, empty/loading/error states everywhere, keyboard-accessible everywhere |
| PWA functionalities (20) | Manifest + service worker + offline shelf + `/offline` page + install prompt + HTTPS host |
| LLM integration & functionality (20) | Real Gemini call with structured output; all minimum functions work live; server-side keys; documented docs review |
| Presentation & demonstration (20) | Demo-friendly example pantry button, visible index-card tabs and strike-through list make a 2-minute demo flow |
| Submission completeness (20) | Source + `.env.example` + PRD + docs + hosted URL + GitHub repo with no secrets |

## 8. Submission Checklist

- File 1: presentation deck (owned by the team).
- File 2: ZIP of the repo, including `.env.example` (names only, never real
  keys).
- Link 1: live HTTPS deployment.
- Link 2: GitHub repository (no committed secrets).

## 9. Dependencies and Setup

See `README.md` for commands, `.env.example` for variable names, and
`supabase/migrations/0001_meal_plans.sql` for the one table the cloud shelf
needs.
