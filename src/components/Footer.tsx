import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-8 text-sm text-mute sm:px-8">
        <span className="font-display font-semibold">PantryPal</span>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/terms" className="hover:text-herb">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-herb">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
