# coci Design Direction

Transcribed from the owner's chosen direction: **editorial kitchen journal**.
Audience: CS students who will see a live class demo, plus anyone cooking at home
with what they already have. The one job each screen does: turn "what's in my
pantry right now" into a concrete meal plan and shopping list, fast.

**Design Read:** PWA tool for cooking students, editorial kitchen-journal style.
Dial: ENERGY 2 / RHYTHM 3 / MOTION 1.

## Color

Neutrals (not counted in the core palette):

- `--paper: #F6F1E5` aged notebook paper (not the generic bright white)
- `--paper-deep: #ECE4D2` shaded paper for layered surfaces
- `--ink: #23281F` squash-seed near-black (warmer than #000)
- `--ink-soft: #5A6051` secondary text, L ~0.62, 4.6:1 on paper
- Focus outline: `#946100` amber, 3:1 against paper (WCAG UI component)

Core palette (2 cores + 1 accent, R-29):

1. `--herb: #4A6B3A` dried-herb green. Headline accents, active day tab, links.
   Reason: "fresh/herbal" is the product's native color, keeps the paper warm
   without a gradient.
2. `--sun: #B97518` turmeric amber used in the line-art motif (pot outline, marker
   circles). Reason: connects the brand mark to the accent so the accent isn't
   orphaned from identity.
3. `--brake: #C43D26` tomato red. One per screen only: the primary action or the
   one key stat. Reason: an "I need to act" signal, never decoration.

Forbidden here: blue-purple gradients, purple-black schemes, neon, glass on
more than 1 face (none planned).

## Type

1. **Fraunces** (display, weights 560–680, optical high). Reason: its soft
   optical axis and wonk-like details read like hand-lettered cafe menus, which
   is exactly the kitchen-journal voice; distinct from both Inter defaults and
   the broadsheet-newsletter look (the "cream + high-contrast serif +
   terracotta" AI tell is avoided by using Fraunces + green/amber on a warm
   oat paper, and no terracotta accent).
2. **Atkinson Hyperlegible** (body/UI). Reason: purposeful accessibility choice
   (designed for low-vision reading, distinctive letterforms) + great contrast
   with Fraunces = three clearly distinct roles, two families only.

Scale: display 36/44 (desktop 44/50), h2 22/28, body 16/26, small 13/18.
Measure: body text ≤ 66ch.

## Layout

- Mobile-first single column, 20px gutters; desktop max 1120px content width.
- Forms use a "recipe card" pattern: paper-deep card with a torn-top edge and a
  small marker (◻ ▢ podcast sticker language) noting which fields are required.
- Nav: N6 masthead (brand left, links right, no hamburger on desktop).
- Footer: a simple single-column publisher footer (course attribution + repo
  link), not a 4-column template.

## Motion (MOTION 1: hover states only)

- Hover/focus state transitions (140ms ease-out) on interactive elements.
- One deliberately silent page, no entrance animations, no loops, no parallax.

## Signature motif

The **recipe index card**: day-plan tabs render as index cards pinned on a
line; shopping list items are struck through with a hand-style marker when
bought. This motif is coci's identity, repeated consistently.

## Principles

- Every technique serves a named hierarchy/identity purpose (write it down).
- No emoji in UI; relevant line icons only where a label isn't enough.
- Honest copy, no invented metrics, no fake testimonials (there are none).
- Empty/loading/error states are designed first-class (R-27).
- Keyboard accessible: visible focus (`:focus-visible`), Escape closes modals.
- WCAG AA contrast; verify with contrast-checker (antislop-human) before ship.
