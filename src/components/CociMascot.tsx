// Coci's little cook: an original, invented chef girl - poofed toque, long
// straight dark hair, sun-warm skin, round cheeks, eyes shut in a happy
// squint, a bright orange baton in hand. Drawn from flat shapes only; no
// filters, so she stays crisp from 512px favicon down to a 40px avatar.
// She is not a likeness of any real person, just a friendly invented cook.
const INK = "#33261d";
const SKIN = "#c98a5e";
const SKIN_DEEP = "#b87a4e";
const HAT = "#f6f1e5";
const BATON = "#e8741f";

export function CociMascot({
  className = "",
  viewBox = "0 0 400 300",
}: {
  className?: string;
  viewBox?: string;
}) {
  return (
    <svg viewBox={viewBox} className={className} aria-hidden="true">
      {/* posture line first, then build outward (portrait of a cook) */}
      <ellipse cx="200" cy="278" rx="86" ry="12" fill={INK} opacity="0.12" />
      {/* long straight hair falls first, so it runs behind the body */}
      <path
        d="M128 132 C 118 170 120 210 132 244 C 146 252 160 250 168 242 C 156 208 154 170 156 130 C 146 120 134 124 128 132 Z"
        fill={INK}
      />
      <path
        d="M272 132 C 282 170 280 210 268 244 C 254 252 240 250 232 242 C 244 208 246 170 244 130 C 254 120 266 124 272 132 Z"
        fill={INK}
      />
      {/* body: her apron, sun-kerchief tucked at the collar */}
      <path
        d="M132 282 C 132 232 158 208 200 208 C 242 208 268 232 268 282 Z"
        fill="#b97518"
      />
      <path
        d="M132 282 L 268 282 L 268 262 L 132 262 Z"
        fill="#f6f1e5"
        opacity="0.85"
      />
      <path d="M200 208 L 188 224 L 200 218 L 212 224 Z" fill="#c04a1e" />
      {/* neck + head base */}
      <rect x="190" y="188" width="20" height="24" rx="9" fill={SKIN_DEEP} />
      <circle cx="200" cy="150" r="62" fill={SKIN} />
      {/* bangs framing warmly */}
      <path
        d="M138 150 a62 62 0 0 1 124 0 c0 -6 -4 -18 -10 -26 c-8 -10 -20 -14 -30 -10 c-8 3 -16 3 -24 0 c-10 -4 -22 0 -30 10 c-6 8 -10 20 -10 26 Z"
        fill={INK}
        opacity="0.9"
      />
      {/* simple sheen on the falls so the hair reads soft, not flat */}
      <path
        d="M140 140 q-6 24 -2 46"
        fill="none"
        stroke="#f6f1e5"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M260 140 q6 24 2 46"
        fill="none"
        stroke="#f6f1e5"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* ears gold studs, tiny and warm */}
      <circle cx="140" cy="158" r="7" fill={SKIN_DEEP} />
      <circle cx="260" cy="158" r="7" fill={SKIN_DEEP} />
      <circle cx="140" cy="160" r="2.4" fill="#b97518" />
      <circle cx="260" cy="160" r="2.4" fill="#b97518" />
      {/* face */}
      {/* happy shut eyes */}
      <path
        d="M176 152 q10 -10 20 0"
        fill="none"
        stroke={INK}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M224 152 q10 -10 20 0"
        fill="none"
        stroke={INK}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* brows, small nose, the wide open smile */}
      <path
        d="M176 138 q10 -6 20 -2"
        fill="none"
        stroke={INK}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M224 136 q10 -4 20 2"
        fill="none"
        stroke={INK}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path d="M198 164 q4 5 -1 8" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M184 178 q16 18 32 0 q-9 11 -16 11 q-7 0 -16 -11 Z"
        fill={INK}
      />
      {/* round cheeks + freckles */}
      <ellipse cx="166" cy="166" rx="14" ry="9" fill="#c04a1e" opacity="0.3" />
      <ellipse cx="234" cy="166" rx="14" ry="9" fill="#c04a1e" opacity="0.3" />
      <circle cx="182" cy="168" r="1.8" fill={INK} opacity="0.5" />
      <circle cx="188" cy="172" r="1.8" fill={INK} opacity="0.5" />
      <circle cx="218" cy="168" r="1.8" fill={INK} opacity="0.5" />
      <circle cx="212" cy="172" r="1.8" fill={INK} opacity="0.5" />
      {/* the orange baton she carries, two hands gripping it */}
      <g transform="rotate(-7 200 246)">
        <rect x="142" y="238" width="132" height="17" rx="8.5" fill={BATON} />
        <rect x="150" y="241" width="12" height="5" rx="2.5" fill="#f6f1e5" opacity="0.4" />
        <rect x="246" y="250" width="12" height="5" rx="2.5" fill="#f6f1e5" opacity="0.4" />
      </g>
      <ellipse cx="182" cy="246" rx="9" ry="8" fill={SKIN_DEEP} />
      <ellipse cx="238" cy="243" rx="9" ry="8" fill={SKIN_DEEP} />
      {/* toque: three puffs cinched by a band, the cook's crown */}
      {/* raised clear of the face: the band edge used to sit across her shut eyes */}
      <g transform="translate(0 -16)" fill={HAT} stroke={INK} strokeWidth="5" strokeLinejoin="round">
        <path d="M158 96 c-16 4 -22 24 -6 34 c6 3 14 4 20 2 Z" />
        <path d="M242 96 c16 4 22 24 6 34 c-6 3 -14 4 -20 2 Z" />
        <path d="M200 62 c-22 0 -32 16 -26 32 c3 8 10 14 18 15 c6 1 12 1 16 0 c8 -1 15 -7 18 -15 c6 -16 -4 -32 -26 -32 Z" />
        <path d="M162 130 c8 6 26 9 38 9 c12 0 30 -3 38 -9 l-4 16 c-14 5 -54 5 -68 0 Z" />
      </g>
      <path
        d="M180 88 c4 6 10 6 14 2 m14 0 c4 4 10 4 12 -2"
        fill="none"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* a sun-bright pin on the toque, her one bit of shine */}
      <path
        d="M231 76 l2.4 5 5.4 2.6 -5.4 2.6 -2.4 5 -2.4 -5 -5.4 -2.6 5.4 -2.6 Z"
        fill="#b97518"
      />
      <path
        d="M215 83 l1.6 3.4 3.6 1.7 -3.6 1.7 -1.6 3.4 -1.6 -3.4 -3.6 -1.7 3.6 -1.7 Z"
        fill="#b97518"
        opacity="0.8"
      />
    </svg>
  );
}

export default CociMascot;
