"use client";

import { useEffect, useState } from "react";
import CociLogo from "./CociLogo";

/**
 * Branded back-to-top pill for the long policy pages: a tiny pot that
 * carries you back up. Appears after you scroll past the intro.
 */
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      aria-label="Back to the top of this page"
      title="Back to the top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed right-4 z-40 flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-xs font-bold text-ink-soft shadow-md transition-colors hover:border-herb hover:text-herb max-lg:bottom-[calc(8.75rem+env(safe-area-inset-bottom))] lg:bottom-24"
    >
      <CociLogo className="size-4 shrink-0" aria-hidden="true" />
      Back to the top
    </button>
  );
}
