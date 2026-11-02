// Coci's little cook: an original, invented chef girl - poofed toque, dark
// side bun, sun-warm skin, eyes shut in a happy squint. Drawn from flat
// shapes only; no filters, so she stays crisp from 512px favicon down to
// a 40px chat avatar. She greets from every Chef Pan surface.
const INK = "#33261d";
const SKIN = "#c98a5e";
const SKIN_DEEP = "#b87a4e";
const HAT = "#f6f1e5";

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
      {/* hair: soft side bun, bangs framing warmly */}
      <path
        d="M138 150 a62 62 0 0 1 124 0 c0 -6 -4 -18 -10 -26 c-8 -10 -20 -14 -30 -10 c-8 3 -16 3 -24 0 c-10 -4 -22 0 -30 10 c-6 8 -10 20 -10 26 Z"
        fill={INK}
        opacity="0.9"
      />
      <ellipse cx="136" cy="166" rx="18" ry="24" fill={INK} />
      <circle cx="130" cy="146" r="13" fill={INK} />
      {/* sheen on the bun so the hair reads soft, not flat */}
      <path
        d="M128 156 q1 -14 12 -22"
        fill="none"
        stroke="#f6f1e5"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* ears gold studs, tiny and warm */}
      <circle cx="138" cy="158" r="7" fill={SKIN_DEEP} />
      <circle cx="262" cy="158" r="7" fill={SKIN_DEEP} />
      <circle cx="138" cy="160" r="2.4" fill="#b97518" />
      <circle cx="262" cy="160" r="2.4" fill="#b97518" />
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
      {/* brows, small nose, the proud open smile */}
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
        d="M186 178 q14 16 30 0 q-8 10 -15 10 q-7 0 -15 -10 Z"
        fill={INK}
      />
      {/* blush + freckles */}
      <ellipse cx="168" cy="168" rx="11" ry="7" fill="#c04a1e" opacity="0.28" />
      <ellipse cx="232" cy="168" rx="11" ry="7" fill="#c04a1e" opacity="0.28" />
      <circle cx="184" cy="170" r="1.8" fill={INK} opacity="0.5" />
      <circle cx="190" cy="174" r="1.8" fill={INK} opacity="0.5" />
      <circle cx="216" cy="170" r="1.8" fill={INK} opacity="0.5" />
      <circle cx="210" cy="174" r="1.8" fill={INK} opacity="0.5" />
      {/* toque: three puffs cinched by a band, the cook's crown */}
      <g fill={HAT} stroke={INK} strokeWidth="5" strokeLinejoin="round">
        <path d="M158 96 c-16 4 -22 24 -6 34 c6 3 14 4 20 2 Z" />
        <path d="M242 96 c16 4 22 24 6 34 c-6 3 -14 4 -20 2 Z" />
        <path d="M200 62 c-22 0 -32 16 -26 32 c3 8 10 14 18 15 c6 1 12 1 16 0 c8 -1 15 -7 18 -15 c6 -16 -4 -32 -26 -32 Z" />
        <path d="M162 130 c8 6 26 9 38 9 c12 0 30 -3 38 -9 l-4 20 c-14 5 -54 5 -68 0 Z" />
      </g>
      <path
        d="M180 104 c4 6 10 6 14 2 m14 0 c4 4 10 4 12 -2"
        fill="none"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* a sun-bright pin on the toque, her one bit of shine */}
      <path
        d="M231 92 l2.4 5 5.4 2.6 -5.4 2.6 -2.4 5 -2.4 -5 -5.4 -2.6 5.4 -2.6 Z"
        fill="#b97518"
      />
      <path
        d="M215 99 l1.6 3.4 3.6 1.7 -3.6 1.7 -1.6 3.4 -1.6 -3.4 -3.6 -1.7 3.6 -1.7 Z"
        fill="#b97518"
        opacity="0.8"
      />
    </svg>
  );
}

export default CociMascot;
