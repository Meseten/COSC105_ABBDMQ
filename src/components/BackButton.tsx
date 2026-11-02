"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * One circular back control for sub-pages. Real history wins; on a first
 * visit (pasted link, shared(tab reset)) it falls back to a sensible page.
 */
export default function BackButton({
  fallbackHref = "/",
  label = "Go back",
}: {
  fallbackHref?: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      aria-label={label}
      title={label}
      className="no-print flex size-11 items-center justify-center rounded-full border border-line bg-card text-ink transition-colors hover:border-herb hover:text-herb"
    >
      <ArrowLeft className="size-5" aria-hidden="true" />
    </button>
  );
}
