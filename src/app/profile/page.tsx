"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Masthead from "@/components/Masthead";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";
import { CociMascot } from "@/components/CociMascot";
import { signOut, useProfile, useSession } from "@/lib/auth";
import { loadCrewCounts } from "@/lib/social";
import { useEffect, useState } from "react";
import { Lock, Users } from "lucide-react";

const BADGES: { code: string; name: string; hint: string }[] = [
  { code: "first-plate", name: "First plate", hint: "Saved your very first plan." },
  { code: "week-runner", name: "Week runner", hint: "Five plans saved." },
  { code: "home-chef", name: "Home chef", hint: "Ten plans saved." },
  { code: "streak-iii", name: "Three in a row", hint: "Planned three days straight." },
  { code: "streak-vii", name: "Full week", hint: "Seven days straight of planning." },
  { code: "first-share", name: "Board poster", hint: "Shared a plan with the community." },
  { code: "crew-v", name: "Comare magnet", hint: "Five comares follow you around." },
  { code: "xp-100", name: "Steam rising", hint: "A hundred xp of cooking notes." },
];

const LEVELS = [0, 40, 100, 200, 350, 600];
const LEVEL_TOPS = [40, 100, 200, 350, 600, 900];

export default function ProfilePage() {
  const session = useSession();
  const { profile } = useProfile();
  const router = useRouter();
  const [crew, setCrew] = useState({ following: 0, followers: 0 });
  const crewTarget = profile?.id;

  useEffect(() => {
    if (!crewTarget) return;
    let alive = true;
    void loadCrewCounts(crewTarget).then((c) => alive && setCrew(c));
    return () => {
      alive = false;
    };
  }, [crewTarget]);
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
  // These badges check the live stats, so old accounts earn them without a fixup run.
  if (profile) {
    if (profile.plan_count >= 1) owned.add("first-plate");
    if (profile.plan_count >= 5) owned.add("week-runner");
    if (profile.plan_count >= 10) owned.add("home-chef");
    if (profile.streak_days >= 3) owned.add("streak-iii");
    if (profile.streak_days >= 7) owned.add("streak-vii");
    if (profile.share_count >= 1) owned.add("first-share");
    if (crew.followers >= 5) owned.add("crew-v");
    if (profile.xp >= 100) owned.add("xp-100");
  }

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-2xl px-5 sm:px-8">
        <div className="pt-6">
          <BackButton fallbackHref="/" label="Back to the planner" />
        </div>
        <section className="index-card mt-4 p-5 sm:p-7">
          <div className="flex items-center gap-5">
            <span className="story-ring block shrink-0 rounded-full p-[3px]">
              <span className="flex size-[74px] items-center justify-center overflow-hidden rounded-full bg-paper-deep">
                <CociMascot className="size-[98px]" viewBox="148 46 104 124" />
              </span>
            </span>
            <dl className="flex flex-1 justify-around text-center">
              <div>
                <dt className="sr-only">Saved plans</dt>
                <dd className="font-display text-2xl font-bold">{profile.plan_count}</dd>
                <dd className="text-xs text-mute">plans</dd>
              </div>
              <div>
                <dt className="sr-only">Planning streak</dt>
                <dd className="font-display text-2xl font-bold">{profile.streak_days}</dd>
                <dd className="text-xs text-mute">day streak</dd>
              </div>
              <div>
                <dt className="sr-only">Shared to the board</dt>
                <dd className="font-display text-2xl font-bold">{profile.share_count}</dd>
                <dd className="text-xs text-mute">shared</dd>
              </div>
              <div>
                <dt className="sr-only">Comares</dt>
                <dd className="font-display text-2xl font-bold">{crew.followers}</dd>
                <dd className="text-xs text-mute">comares</dd>
              </div>
            </dl>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 truncate font-display text-xl font-semibold">
                <span className="truncate">{profile.display_name}</span>
                {profile.is_private && (
                  <span
                    className="flex shrink-0 items-center gap-1 rounded bg-paper-deep px-1.5 py-0.5 align-middle text-[10px] font-bold text-sun"
                    title="Only your comares sees your boards"
                  >
                    <Lock className="size-3" aria-hidden="true" /> private
                  </span>
                )}
              </h1>
              <p className="truncate text-xs text-mute">
                {session?.user?.email ?? "Signed in"} · Level {level}
              </p>
              {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
            </div>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="min-h-10 shrink-0 rounded-sm border border-line px-4 py-2 text-sm font-bold text-brake transition-colors hover:border-brake"
            >
              Sign out
            </button>
          </div>

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

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/friends"
              className="min-h-10 flex-1 rounded-sm border border-line bg-card px-4 py-2 text-center text-sm font-bold transition-colors hover:border-herb hover:text-herb"
            >
              <span className="inline-flex items-center gap-2">
                <Users className="size-4" aria-hidden="true" />
                My crew · {crew.following} following, {crew.followers} following me
              </span>
            </Link>
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
