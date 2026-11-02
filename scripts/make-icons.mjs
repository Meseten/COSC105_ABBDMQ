// Renders the coci logo (a squat pot under a steam-written "C") into
// every icon size. Run: node scripts/make-icons.mjs
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, writeFileSync } from "node:fs";

const INK = "#23281F";
const HERB = "#4A6B3A";
const SUN = "#B97518";
const PAPER = "#F6F1E5";

/**
 * coci mark: the cute filled pot with its face, lid, sun knob and the
 * steam curling into a C on top. cocina, kitchen, coci.
 */
function mark({ paper = PAPER, fg = INK, face = paper, accent = HERB, sun = SUN } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${paper}"/>
  <!-- steam writing a C over the pot -->
  <path d="M316 120 a 54.4 54.4 0 1 0 -6.4 86.4" fill="none" stroke="${accent}" stroke-width="35" stroke-linecap="round"/>
  <path d="M248 140 c-12 -56 37 -59 41.6 -94.4" fill="none" stroke="${sun}" stroke-width="22" stroke-linecap="round"/>
  <!-- pot belly, filled and warm -->
  <path d="M124 248 C 124 324 128 364 164 392 C 188 412 236 428 256 428 C 276 428 324 412 348 392 C 384 364 388 324 388 248 Z" fill="${accent}"/>
  <ellipse cx="188" cy="304" rx="17.6" ry="44" fill="#ffffff" opacity="0.28"/>
  <!-- the face: bead eyes, smile, sun cheeks -->
  <circle cx="222.4" cy="320" r="16.8" fill="${face}"/>
  <circle cx="289.6" cy="320" r="16.8" fill="${face}"/>
  <path d="M222.4 356 q 33.6 32 67.2 0" fill="none" stroke="${face}" stroke-width="20.8" stroke-linecap="round"/>
  <circle cx="190.4" cy="348.8" r="13.6" fill="${sun}" opacity="0.75"/>
  <circle cx="321.6" cy="348.8" r="13.6" fill="${sun}" opacity="0.75"/>
  <!-- lid -->
  <rect x="104" y="192" width="304" height="60" rx="28.8" fill="${paper}" stroke="${fg}" stroke-width="27.2"/>
  <circle cx="256" cy="164" r="24.8" fill="${sun}" stroke="${fg}" stroke-width="19.2"/>
  <!-- short side handles -->
  <path d="M88 240 h 40 M 384 240 h 40" fill="none" stroke="${fg}" stroke-width="27.2" stroke-linecap="round"/>
</svg>`;
}

function render(svg, size) {
  const r = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    font: { loadSystemFonts: false, loadExternalFonts: false },
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
const favicon = mark({ fg: PAPER, paper: INK, face: INK, accent: "#9CC47E", sun: "#D9A04A" });
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
