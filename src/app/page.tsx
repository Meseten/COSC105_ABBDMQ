import Link from "next/link";
import Masthead from "@/components/Masthead";
import PlannerForm from "@/components/PlannerForm";
import HomeFeed from "@/components/HomeFeed";
import Footer from "@/components/Footer";

function HowStep({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex-1 border-t-2 border-line pt-3 sm:border-t-0 sm:border-l-2 sm:pl-4">
      <span className="font-display text-2xl font-semibold text-sun">{n}</span> {children}
    </li>
  );
}

export default function Home() {
  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-5xl px-5 sm:px-8">
        <section className="max-w-2xl py-10 sm:py-14">
          <h1 className="font-display text-4xl leading-tight font-semibold sm:text-5xl">
            Cook meals with what you already have.
          </h1>
          <p className="mt-4 text-lg leading-relaxed">
            List your pantry ingredients, set a budget, and coci drafts a
            day-by-day meal plan plus a shopping list of the missing bits. It is
            built for closets, condo kitchens, and peso budgets: the dishes bend
            to your servings, diet, and the cuisine you like.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/community"
              className="rounded-sm border border-line bg-card px-5 py-3 text-base font-bold transition-colors hover:border-herb hover:text-herb"
            >
              Peek at what others cooked
            </Link>
            <Link
              href="/assistant"
              className="rounded-sm border border-line bg-card px-5 py-3 text-base font-bold transition-colors hover:border-herb hover:text-herb"
            >
              Ask Chef Pan
            </Link>
          </div>
        </section>

        <section className="mb-10 max-w-2xl">
          <h2 className="sr-only">How it works</h2>
          <ol className="flex flex-col gap-2 text-base sm:flex-row sm:gap-8">
            <HowStep n="1">You list your pantry and rules below.</HowStep>
            <HowStep n="2">Gemini drafts each dish, step by step.</HowStep>
            <HowStep n="3">You shop with the built list and cook.</HowStep>
          </ol>
        </section>

        <HomeFeed />
        <PlannerForm />
      </main>
      <Footer />
    </>
  );
}
