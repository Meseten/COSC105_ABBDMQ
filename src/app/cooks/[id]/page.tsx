"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Masthead from "@/components/Masthead";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";
import { CociMascot } from "@/components/CociMascot";
import { db } from "@/lib/db";
import { useSession } from "@/lib/auth";
import {
  loadCrewCounts,
  isFollowing,
  setFollowing,
  type CookRow,
} from "@/lib/social";
import { loadPublicPlans, toggleLike, type PublicPlan } from "@/lib/community";
import { getSignedInUserId } from "@/lib/plans";
import { pesos } from "@/lib/types";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";

export default function CookPage() {
  const params = useParams<{ id: string }>();
  const cookId = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const session = useSession();
  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const [cook, setCook] = useState<(CookRow & { bio: string }) | null>(null);
  const [missing, setMissing] = useState(false);
  const [following, setFollowingState] = useState(false);
  const [crew, setCrew] = useState({ following: 0, followers: 0 });
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!cookId) return;
    void getSignedInUserId().then(setUserId);
    const sb = db();
    if (!sb) return;
    void sb
      .from("profiles")
      .select("id, display_name, xp, plan_count, streak_days, is_private, bio")
      .eq("id", cookId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCook(data as CookRow & { bio: string });
        else if (!data) setMissing(true);
      });
    void loadCrewCounts(cookId).then(setCrew);
  }, [cookId, session]);

  useEffect(() => {
    if (session === undefined || !cookId) return;
    let alive = true;
    void isFollowing(userId, cookId).then((next) => {
      if (alive) setFollowingState(next);
    });
    void loadPublicPlans(userId).then((list) => {
      if (alive) setPlans(list.filter((p) => p.user_id === cookId));
    });
    return () => {
      alive = false;
    };
  }, [session, userId, cookId]);

  const flipFollow = async () => {
    if (!signedIn) {
      toast.error("Sign in to follow cooks.");
      router.push("/login");
      return;
    }
    if (!userId) return;
    const was = following;
    setFollowingState(!was);
    setCrew((c) => ({ ...c, followers: c.followers + (was ? -1 : 1) }));
    try {
      await setFollowing(userId, cookId, !was);
      toast.success(was ? "Removed from your comares." : "Added to your comares.");
    } catch {
      setFollowingState(was);
      setCrew((c) => ({ ...c, followers: c.followers + (was ? 1 : -1) }));
      toast.error("Could not save that.");
    }
  };

  const like = async (plan: PublicPlan) => {
    if (!signedIn) {
      toast.error("Sign in to like recipes.");
      return;
    }
    setPlans(
      (prev) =>
        prev?.map((r) =>
          r.id === plan.id
            ? { ...r, liked: !r.liked, like_count: r.like_count + (r.liked ? -1 : 1) }
            : r,
        ) ?? null,
    );
    try {
      if (userId) await toggleLike(plan.id, userId, plan.liked);
    } catch {
      setPlans(
        (prev) =>
          prev?.map((r) =>
            r.id === plan.id ? { ...r, liked: plan.liked, like_count: plan.like_count } : r,
          ) ?? null,
      );
      toast.error("Could not save the like.");
    }
  };

  if (missing) {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-xl px-5 py-16 text-center">
          <h1 className="font-display text-3xl font-semibold">No cook here</h1>
          <p className="mt-2 text-sm text-mute">
            That kitchen is not on the board. It may have been deleted.
          </p>
          <Link
            href="/community"
            className="mt-6 inline-block rounded-sm bg-herb px-5 py-3 text-sm font-bold text-paper"
          >
            Back to the board
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const locked = cook?.is_private === true && !following && userId !== cookId;

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-2xl px-5 sm:px-8">
        {cook === null ? (
          <p className="py-12 text-sm text-mute">
            <span className="simmer">Walking to that kitchen...</span>
          </p>
        ) : (
          <>
            <div className="pt-6">
              <BackButton fallbackHref="/community" label="Back to the board" />
            </div>
            <section className="index-card mt-4 p-5 sm:p-7">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                <span className="story-ring block shrink-0 rounded-full p-[3px]">
                  <span className="flex size-[74px] items-center justify-center rounded-full bg-paper-deep font-display text-2xl font-bold">
                    {cook.display_name.slice(0, 1).toUpperCase()}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate font-display text-xl font-semibold">
                    {cook.display_name}
                  </h1>
                  <p className="mt-1 text-xs text-mute">
                    Level {Math.min(6, Math.floor(cook.xp / 100) + 1)} cook
                  </p>
                  {cook.bio ? (
                    <p className="mt-2 text-sm">{cook.bio}</p>
                  ) : (
                    <p className="mt-2 text-xs text-mute">This cook keeps their kitchen notes short.</p>
                  )}
                </div>
                {userId !== cookId && (
                  <button
                    type="button"
                    onClick={() => void flipFollow()}
                    aria-pressed={following}
                    className={`min-h-10 shrink-0 rounded-sm px-5 text-sm font-bold text-paper transition-opacity hover:opacity-90 ${
                      following ? "bg-ink/[0.55]" : "bg-herb"
                    }`}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                )}
              </div>

              <dl className="mt-5 grid grid-cols-4 gap-2 text-center" aria-label="Cook stats">
                <div className="rounded bg-paper-deep py-2">
                  <dt className="sr-only">Boards shared</dt>
                  <dd className="font-display text-lg font-bold">{cook.plan_count}</dd>
                  <dd className="text-[11px] text-mute">boards</dd>
                </div>
                <div className="rounded bg-paper-deep py-2">
                  <dt className="sr-only">Streak</dt>
                  <dd className="font-display text-lg font-bold">{cook.streak_days}</dd>
                  <dd className="text-[11px] text-mute">streak</dd>
                </div>
                <div className="rounded bg-paper-deep py-2">
                  <dt className="sr-only">Comares</dt>
                  <dd className="font-display text-lg font-bold">{crew.followers}</dd>
                  <dd className="text-[11px] text-mute">comares</dd>
                </div>
                <div className="rounded bg-paper-deep py-2">
                  <dt className="sr-only">Following</dt>
                  <dd className="font-display text-lg font-bold">{crew.following}</dd>
                  <dd className="text-[11px] text-mute">following</dd>
                </div>
              </dl>
            </section>

            {locked ? (
              <section className="index-card mt-6 flex flex-col items-center p-8 text-center">
                <CociMascot className="w-40" viewBox="92 46 216 242" />
                <h2 className="mt-4 font-display text-xl font-semibold">
                  This kitchen draws the curtain
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-mute">
                  {cook.display_name} keeps their boards for their comares only. Follow them if
                  they know your cooking, and their weekly plans show up here.
                </p>
              </section>
            ) : (
              <section className="mb-6 mt-6">
                <h2 className="font-display text-xl font-semibold">
                  {plans?.length ? "Boards on the table" : "Nothing shared yet"}
                </h2>
                {plans === null ? (
                  <p className="py-6 text-sm text-mute">
                    <span className="simmer">Setting the table...</span>
                  </p>
                ) : plans.length === 0 ? (
                  <p className="mt-2 text-sm text-mute">
                    When they post to the board, their plans pile up here.
                  </p>
                ) : (
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {plans.map((plan) => (
                      <li key={plan.id} className="index-card flex flex-col p-4">
                        <h3 className="font-display text-lg font-semibold">{plan.title}</h3>
                        <p className="mt-1 text-sm text-mute">
                          {plan.plan.mealPlan.length}{" "}
                          {plan.plan.mealPlan.length === 1 ? "day" : "days"} ·{" "}
                          {plan.plan.shoppingList.length} items · ~
                          {pesos(plan.plan.financialSummary.totalEstimatedCost)}
                        </p>
                        {plan.visibility === "buddies" && (
                          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-sun">
                            <Lock className="size-3" aria-hidden="true" /> comares only
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <Link
                            href={`/community/${plan.id}`}
                            className="min-h-10 flex-1 rounded-sm border border-line bg-card px-3 py-2 text-center text-sm font-bold transition-colors hover:border-herb hover:text-herb"
                          >
                            Open the plan
                          </Link>
                          <button
                            type="button"
                            onClick={() => void like(plan)}
                            aria-pressed={plan.liked}
                            aria-label={plan.liked ? "Unlike" : "Like"}
                            className={`flex min-h-10 items-center gap-1.5 rounded-sm px-3 text-sm font-bold transition-colors ${
                              plan.liked
                                ? "bg-brake text-on-brake"
                                : "border border-line hover:border-brake hover:text-brake"
                            }`}
                          >
                            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
                              <path
                                d="M8 13.6C4.6 11 2.4 8.9 2.4 6.3 2.4 4.5 3.8 3.2 5.4 3.2c1 0 2 .5 2.6 1.4.6-.9 1.6-1.4 2.6-1.4 1.6 0 3 1.3 3 3.1 0 2.6-2.2 4.7-5.6 7.3Z"
                                fill={plan.liked ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="1.2"
                              />
                            </svg>
                            {plan.like_count}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
