// The coci mark: a squat enamel pot with a friendly face on its belly whose
// steam curls into a letter C on top. The pot fills herb green, the face
// takes the card color, so it reads as a little app-icon mascot on any
// surface, light or dark.
export default function CociLogo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <rect
        width="64"
        height="64"
        rx="15"
        fill="currentColor"
        opacity="0.08"
      />
      {/* steam writing a C over the pot */}
      <path
        d="M39.5 15 a 6.8 6.8 0 1 0 -0.8 10.8"
        fill="none"
        stroke="var(--herb)"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      <path
        d="M31 17.5 c-1.5 -7 4.6 -7.4 5.2 -11.8"
        fill="none"
        stroke="var(--sun)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* pot belly, filled and warm */}
      <path
        d="M15.5 31 C 15.5 40.5 16 45.5 20.5 49 C 23.5 51.5 29.5 53.5 32 53.5 C 34.5 53.5 40.5 51.5 43.5 49 C 48 45.5 48.5 40.5 48.5 31 Z"
        fill="var(--herb)"
      />
      {/* a curve of light so the enamel looks wet */}
      <ellipse cx="23.5" cy="38" rx="2.2" ry="5.5" fill="#ffffff" opacity="0.28" />
      {/* the face: two bead eyes, a smile, sun-warm cheeks */}
      <circle cx="27.8" cy="40" r="2.1" fill="var(--card)" />
      <circle cx="36.2" cy="40" r="2.1" fill="var(--card)" />
      <path
        d="M27.8 44.5 q 4.2 4 8.4 0"
        fill="none"
        stroke="var(--card)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="23.8" cy="43.6" r="1.7" fill="var(--sun)" opacity="0.75" />
      <circle cx="40.2" cy="43.6" r="1.7" fill="var(--sun)" opacity="0.75" />
      {/* lid */}
      <rect
        x="13"
        y="24"
        width="38"
        height="7.5"
        rx="3.6"
        fill="var(--card)"
        stroke="currentColor"
        strokeWidth="3.4"
      />
      {/* lid knob, sun colored */}
      <circle cx="32" cy="20.5" r="3.1" fill="var(--sun)" stroke="currentColor" strokeWidth="2.4" />
      {/* short side handles */}
      <path
        d="M11 30 h 5 M 48 30 h 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
