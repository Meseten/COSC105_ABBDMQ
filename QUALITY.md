# coci — ISO/IEC 25010 quality note (v1.0, October 2026)

Evaluated against the eight product-quality characteristics of
ISO/IEC 25010:2023. Practical limits are stated honestly — no web app scores a
perfect ceiling on every sub-characteristic; each row below names the control
that exists and the residual risk.

## 1. Functional suitability

| Sub-characteristic | Evidence |
|---|---|
| Functional completeness | Pantry-based plan drafting (servings, days, diet, cuisine, budget), shopping list, per-plan print layout, shelf with device + cloud copies, copy-back, community share/search/like, XP + levels + daily streak + badges, top-cooks leaderboard, community chat, Chef Pan assistant, moderation, terms/privacy/legal contact. |
| Functional correctness | Plan output validated against a strict JSON schema server-side (`src/lib/schema.ts`); like counts and daily XP granted exactly once by SQL functions/triggers, not UI counters; leaderboard and profile stats read from server (security-definer) functions. |
| Appropriateness | Every user-visible surface maps to a stated COSC 105 goal (planning, finance, community). No dead UI: install/manifest/offline shells were removed when the team decided web-only. |

## 2. Performance efficiency

Measured locally (production build, dev-server model calls add network time):

- Page weight: first-load JS shared by all routes ≈ 103 kB; heaviest route ≈ 185 kB.
- Static generation: marketing/legal/login/community shells are prerendered; only personalized pages render dynamically.
- AI latency: plan generation 3.5–4.3 s end-to-end via `gemini-3.5-flash-lite` (low thinking), chat 2.2 s; a model-failover chain prevents the 404/timeout stalls seen earlier (single-digit-second worst case with retries across three lanes).
- Rate limiting + input caps on both AI routes bound worst-case cost and latency under abuse.

Residual: serverless cold start on Vercel (~200–500 ms) is inherent to the platform.

## 3. Compatibility

- Browsers: modern evergreen set; layout uses Tailwind v4 + print styles for plan export-to-PDF.
- Responsive: form, board, chat and shelf tested at 360 px+ widths; touch targets ≥ 40 px.
- No native dependencies; deployable anywhere Node/Next runs (dev here: Node 18.19, hosted target: Vercel).

## 4. Usability

- Semantics and accessibility: labelled inputs, `aria` roles on tabs/menus, focus states, keyboard-operable menus, form `autoComplete` hints.
- Language follows user wording (Chef Pan, no internal jargon).
- Errors are plain-language and actionable ("Reconnect to make a new plan…").
- Terms + privacy in human prose, contactable DPO by email.

Residual: no formal a11y audit with assistive-tech users yet; recommended before release to the public board.

## 5. Reliability

- Failure handling: AI routes fail over across a model chain (404-retired → next lane; 503-overloaded → next lane) and return controlled messages rather than crashes.
- Data integrity: RLS everywhere; writes only via server functions; optimistic chat sends reconcile against server truth; device shelf is a fallback copy, never the source.
- Availability: stateless frontend on Vercel + managed Supabase Postgres with daily backups; no app-owned degradable state.
- Recovery: global error boundary with retry; expired sessions route to sign-in rather than dead ends.

## 6. Security (verified October 2026)

- `npm audit`: **0 vulnerabilities** (moderate+high found earlier: Next↔postcss path traversal GHSAs; fixed via `overrides` pinning Next's nested postcss to `^8.5.18`, since the vendor fix ships in Next 16 which is a breaking upgrade — documented deferral-by-upgrade with a review-on-upgrade date).
- Headers on every route: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (battery, camera, geolocation, microphone off).
- Secret handling: Gemini key env-only, referenced exclusively in `src/lib/gemini.ts` + API routes (server runtime); `.env.local` git-ignored; `NEXT_PUBLIC_*` prefix reserved for the two public Supabase variables. No key material in the repo or logs.
- OWASP input checks: schema validation on both AI routes (422 + 400 paths), payload-size and field-count caps, 3 s client cooldown, prompt-injection containment (LLM output rendered as escaped text only — no `innerHTML`, no `dangerouslySetInnerHTML`, no `eval`).
- Access control: Supabase RLS on every table; row write/update/delete gated to `auth.uid()`; community moderation via `is_moderator()`/`is_admin()` security-definer SQL functions; profile role never derived from client claims.
- Sessions: Supabase Auth issues httpOnly session tokens (refresh token rotation on by default); client timeout on refresh prevents stuck sessions; anonymous sessions upgrade cleanly at signup.
- Residual: no WAF; in-memory rate limiting restarts per serverless instance (single-region deploy acceptable; move to a shared store before multi-region).

## 7. Maintainability

- Modularity: pages → components → lib/engine split; no cross-import cycles; server-only markers on the Gemini client.
- Type safety: `tsc --noEmit` clean (0 errors); strict mode.
- Tests: no automated suite yet — the honest gap. Manual verification of every route, both AI endpoints, RBAC and RLS passed October 31 2026. A Playwright smoke suite is the recommended first investment.
- Migrations: versioned SQL files 0001–0006 mirror applied DB state; destructive changes documented inline.
- Config: no build-time wizardry; plain `next build`.

## 8. Portability

- No OS-specific code; runs on any Node 18.17+ host and Vercel/Netlify/Docker via standard `next build`.
- Environment configuration is limited to three variables (all documented in README + `.env.example`).
- No vendor lock in app logic: Gemini access is one module (`src/lib/gemini.ts`), Supabase one module (`src/lib/db.ts`), swappable behind their interfaces.

## Known ceilings (stated, not hidden)

1. Offline is intentionally out of scope: the app is online-only by decision; the device shelf is a network-failure fallback, not an offline mode.
2. Rate limiting is per-instance; move to Redis/Upstash before multi-region.
3. No CI pipeline yet — add lint + `tsc` + build + `npm audit` (fail on high) before the first public deploy.
4. Score reporting here is self-assessed against the 25010 model, not by an accredited lab; controls named above are the evidence trail.
