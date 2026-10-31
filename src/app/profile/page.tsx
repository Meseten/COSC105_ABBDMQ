"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { signOut, useProfile, useSession } from "@/lib/auth";

const BADGES: { code: string; name: string; hint: string }[] = [
  { code: "first-plate", name: "First plate", hint: "Saved your very first plan." },
  { code: "week-runner", name: "Week runner", hint: "Five plans saved." },
  { code: "home-chef", name: "Home chef", hint: "Ten plans saved." },
  { code: "streak-iii", name: "Three in a row", hint: "Planned three days straight." },
  { code: "streak-vii", name: "Full week", hint: "Seven days straight of planning." },
  { code: "first-share", name: "Board poster", hint: "Shared a plan with the community." },
];

const LEVELS = [0, 40, 100, 200, 350, 600];
const LEVEL_TOPS = [40, 100, 200, 350, 600, 900];

export default function ProfilePage() {
  const session = useSession();
  const { profile } = useProfile();
  const router = useRouter();
  if (session === undefined) {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-2xl px-5 py-12">
          <p className="text-sm text-mute">
            <span className="simmer">Checking your apron...</span>
          </p>
        </main>
        <Footer />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-xl px-5 py-16 text-center">
          <h1 className="font-display text-3xl font-semibold">Not signed in</h1>
          <p className="mt-2 text-sm text-mute">
            Sign in to keep a profile: streaks, badges and a synced kitchen.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-sm bg-herb px-5 py-3 text-sm font-bold text-paper"
          >
            Sign in
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const level = profile.level;
  const floor = LEVELS[level - 1] ?? 0;
  const ceil = LEVEL_TOPS[level - 1] ?? floor + 400;
  const pct = Math.min(100, Math.round(((profile.xp - floor) / (ceil - floor)) * 100));
  const owned = new Set(profile.badges);

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-2xl px-5 sm:px-8">
        <section className="index-card mt-8 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-2xl font-semibold">{profile.display_name}</h1>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="min-h-10 rounded-sm border border-line px-4 py-2 text-sm font-bold text-brake transition-colors hover:border-brake"
            >
              Sign out
            </button>
          </div>
          <p className="mt-1 text-sm text-mute">
            {session?.user?.email ?? "Signed in"} · Level {level}
          </p>

          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold text-mute">
              <span>
                {profile.xp} xp
              </span>
              <span>Level {level + 1} at {ceil} xp</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress to the next level"
              className="mt-1 h-3 overflow-hidden rounded-full bg-paper-deep"
            >
              <div
                className="h-full rounded-full bg-herb transition-all duration-500"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="rounded bg-paper-deep px-3 py-1.5 font-bold">
              {profile.plan_count} {profile.plan_count === 1 ? "plan" : "plans"} saved
            </span>
            <span className="rounded bg-paper-deep px-3 py-1.5 font-bold">
              {profile.streak_days}-day streak
            </span>
            <span className="rounded bg-paper-deep px-3 py-1.5 font-bold">
              {profile.share_count} shared
            </span>
          </div>
        </section>

        <section className="index-card mt-6 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Badges</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {BADGES.map((badge) => {
              const has = owned.has(badge.code);
              return (
                <li
                  key={badge.code}
                  className={`flex items-start gap-3 rounded border p-3 ${
                    has ? "border-herb bg-paper-deep" : "border-line opacity-60"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full text-lg ${
                      has ? "bg-herb text-paper" : "bg-paper-deep text-mute"
                    }`}
                  >
                    {has ? "✓" : "·"}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{badge.name}</p>
                    <p className="text-xs text-mute">{badge.hint}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="index-card mb-4 mt-6 flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-semibold">Account settings</h2>
            <p className="mt-1 text-xs text-mute">
              Cook name, password, data copy and account deletion now live in one place.
            </p>
          </div>
          <Link
            href="/settings"
            className="min-h-11 rounded-sm border border-line px-4 py-2 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
          >
            Open settings
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
