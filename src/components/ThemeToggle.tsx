"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    setTheme(
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light",
    );
  }, []);

  if (theme === null) {
    // Fixed-size placeholder until hydration so the masthead never shifts.
    return (
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-sm border border-line"
      >
        <Sun className="size-4 text-mute opacity-40" />
      </span>
    );
  }

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("pantrypal.theme", next);
    } catch {
      // Private mode may block storage; the attribute still applies this visit.
    }
    setTheme(next);
  };

  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-10 items-center justify-center rounded-sm border border-line text-mute transition-colors hover:border-sun hover:text-sun-deep"
    >
      {/* Sun means “tap for light”, moon means “tap for dark”. */}
      {dark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
    </button>
  );
}
