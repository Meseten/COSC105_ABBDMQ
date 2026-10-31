import Link from "next/link";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <main id="pp-main" className="mx-auto max-w-xl px-5 py-20 text-center">
        <p className="font-display text-6xl font-semibold text-sun">404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold">
          This page is off the menu
        </h1>
        <p className="mt-2 text-sm text-mute">
          The page you asked for is not in the pantry.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-sm bg-herb px-5 py-3 text-sm font-bold text-paper transition-opacity hover:opacity-90"
        >
          Back to the planner
        </Link>
      </main>
      <Footer />
    </>
  );
}
