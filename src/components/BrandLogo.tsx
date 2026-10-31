// PantryPal brand mark: an open pantry cabinet with a smiling jar inside -
// the pantry is the house, the jar that greets you is the pal.
export default function BrandLogo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <rect width="512" height="512" rx="96" fill="currentColor" opacity="0.08" />
      <g fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
        <rect x="106" y="128" width="300" height="280" rx="14" />
        <line x1="278" y1="128" x2="278" y2="408" />
        <line x1="278" y1="268" x2="406" y2="268" />
        <path d="M232 128 L 96 96 L 96 352 L 232 408" />
        <circle cx="128" cy="212" r="11" fill="currentColor" stroke="none" />
        <rect x="308" y="196" width="26" height="66" rx="6" />
        <rect x="344" y="186" width="26" height="76" rx="6" />
        <path d="M312 328 h72 c8 14 10 24 10 38 a46 46 0 0 1 -92 0 c0 -14 2 -24 10 -38 Z" />
        <line x1="306" y1="322" x2="390" y2="322" />
        <line x1="312" y1="300" x2="384" y2="300" />
      </g>
      <circle cx="336" cy="350" r="9" fill="currentColor" />
      <circle cx="360" cy="350" r="9" fill="currentColor" />
      <path
        d="M334 366 q14 10 28 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M369 292 q16 -18 34 -12 q2 18 -16 28 q-14 6 -20 -4 q-2 -8 2 -12 Z"
        fill="var(--herb)"
        stroke="none"
      />
      <path
        d="M322 276 c-6 -10 0 -18 0 -28 M340 278 c6 -12 -2 -20 2 -30"
        fill="none"
        stroke="var(--sun)"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </svg>
  );
}
