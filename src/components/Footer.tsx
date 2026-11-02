import Link from "next/link";
import CociLogo from "./CociLogo";

export default function Footer() {
  return (
    <footer className="no-print border-t border-line pb-24 lg:pb-16">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-8 text-sm text-mute sm:px-8">
        <span className="flex items-center gap-2">
          <CociLogo className="size-5" />
          <span className="font-display font-semibold lowercase">coci</span>
          <span aria-hidden="true">·</span>
          <span>meals from your cocina</span>
        </span>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/terms" className="hover:text-herb">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-herb">
            Privacy
          </Link>
          <Link href="/help" className="hover:text-herb">
            Help
          </Link>
        </nav>
      </div>
    </footer>
  );
}
