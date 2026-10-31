"use client";

// Renders when the React tree itself throws; keeps the failure human-safe.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: "32rem", margin: "5rem auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.6rem" }}>The kitchen caught fire</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          Something went wrong on our end. Your kitchen board is untouched.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.25rem",
            padding: "0.7rem 1.5rem",
            border: "none",
            borderRadius: 3,
            background: "#4A6B3A",
            color: "#F6F1E5",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
