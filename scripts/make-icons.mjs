// Renders the PantryPal logo (open pantry + smiling jar) into every icon size.
// Run: node scripts/make-icons.mjs
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, writeFileSync } from "node:fs";

const INK = "#23281F";
const HERB = "#4A6B3A";
const SUN = "#B97518";
const PAPER = "#F6F1E5";

/**
 * PantryPal mark: the door of a pantry stands open, and inside it a jar
 * with a smile greets you. The "pal" is the jar; the pantry is the house.
 */
function mark({ paper = PAPER, fg = INK, accent = HERB, sun = SUN } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${paper}"/>
  <!-- the pantry cabinet: an open door on the left, deep shelf on the right -->
  <g fill="none" stroke="${fg}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <!-- cabinet body -->
    <rect x="106" y="128" width="300" height="280" rx="14"/>
    <!-- interior shelf line -->
    <line x1="278" y1="128" x2="278" y2="408"/>
    <line x1="278" y1="268" x2="406" y2="268"/>
    <!-- open door, swung out to the left -->
    <path d="M232 128 L 96 96 L 96 352 L 232 408"/>
    <circle cx="128" cy="212" r="9" fill="${fg}" stroke="none"/>
    <!-- cans and tins on the top-right shelf -->
    <rect x="308" y="196" width="26" height="66" rx="6"/>
    <rect x="344" y="186" width="26" height="76" rx="6"/>
    <!-- the pal: a smiling jar on the bottom shelf -->
    <path d="M312 328 h72 c8 14 10 24 10 38 a46 46 0 0 1 -92 0 c0 -14 2 -24 10 -38 Z"/>
    <line x1="306" y1="322" x2="390" y2="322"/>
    <line x1="312" y1="300" x2="384" y2="300"/>
  </g>
  <!-- jar's friendly face -->
  <circle cx="336" cy="350" r="7" fill="${fg}"/>
  <circle cx="360" cy="350" r="7" fill="${fg}"/>
  <path d="M334 366 q14 10 28 0" fill="none" stroke="${fg}" stroke-width="8" stroke-linecap="round"/>
  <!-- a little leaf tucked on the jar lid: fresh, homegrown -->
  <path d="M369 292 q16 -18 34 -12 q2 18 -16 28 q-14 6 -20 -4 q-2 -8 2 -12 Z" fill="${accent}" stroke="none"/>
  <!-- steam curls rising from the jar, colored warm -->
  <path d="M322 276 c-6 -10 0 -18 0 -28 M340 278 c6 -12 -2 -20 2 -30" fill="none" stroke="${sun}" stroke-width="9" stroke-linecap="round"/>
</svg>`;
}

function render(svg, size) {
  const r = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    shapeRendering: "geometricPrecision",
  });
  return r.render().asPng();
}

mkdirSync("public/icons", { recursive: true });

const app = mark();
writeFileSync("public/icons/icon-192.png", render(app, 192));
writeFileSync("public/icons/icon-512.png", render(app, 512));

// Maskable: the artwork sits in the inner 80% safe zone on a full-bleed paper.
const maskable = mark();
writeFileSync("public/icons/icon-512-maskable.png", render(maskable, 512));

// Favicon + Apple touch icon share the artwork, tinted differently.
const favicon = mark({ fg: PAPER, paper: INK, accent: "#9CC47E", sun: "#D9A04A" });
writeFileSync("public/favicon.png", render(favicon, 64));
writeFileSync("public/icon-192-alt.png", render(favicon, 192));

// App icon and apple icon live at the app directory root.
const dark = mark({ paper: "#201D15", fg: "#EDE6D4", accent: "#9CC47E" });
writeFileSync("src/app/icon.png", render(dark, 180));
writeFileSync("src/app/apple-icon.png", render(mark(), 180));

console.log("icons regenerated:");
console.log("  public/icons/icon-192.png");
console.log("  public/icons/icon-512.png");
console.log("  public/icons/icon-512-maskable.png");
console.log("  src/app/icon.png, src/app/apple-icon.png, public/favicon.png");
