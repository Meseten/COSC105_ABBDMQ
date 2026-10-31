"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { getSignedInUserId } from "@/lib/plans";
import { loadPublicPlans, toggleLike, type PublicPlan } from "@/lib/community";
import { db } from "@/lib/db";
import { useSession } from "@/lib/auth";
import { pesos } from "@/lib/types";

interface LeaderRow {
  id: string;
  display_name: string;
  xp: number;
  plan_count: number;
  streak_days: number;
}

function when(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(
    new Date(iso),
  );
}

export default function CommunityPage() {
  const session = useSession();
  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const [rows, setRows] = useState<PublicPlan[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mineOnly, setMineOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "loved">("new");
  const [board, setBoard] = useState<LeaderRow[]>([]);

  useEffect(() => {
    if (session === undefined) return;
    let alive = true;
    void getSignedInUserId().then((uid) => {
      if (!alive) return;
      setUserId(uid);
      void loadPublicPlans(uid, 0, sort).then((list) => alive && setRows(list));
      const sb = db();
      if (sb) {
        void sb
          .from("profiles")
          .select("id, display_name, xp, plan_count, streak_days")
          .gt("xp", 0)
          .order("xp", { ascending: false })
          .limit(8)
          .then(({ data }) => {
            if (alive && data) setBoard(data as LeaderRow[]);
          });
      }
    });
    return () => {
      alive = false;
    };
  }, [session, sort]);

  const shown = rows
    ?.filter((r) => (mineOnly && userId ? r.user_id === userId : true))
    .filter((r) =>
      query.trim()
        ? (r.title + " " + (r.cook_name ?? ""))
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        : true,
    ) ?? null;

  const like = async (plan: PublicPlan) => {
    if (!signedIn) {
      toast.error("Sign in to like recipes.");
      return;
    }
    setRows(
      (prev) =>
        prev?.map((r) =>
          r.id === plan.id
            ? {
                ...r,
                liked: !r.liked,
                like_count: r.like_count + (r.liked ? -1 : 1),
              }
            : r,
        ) ?? null,
    );
    try {
      if (userId) await toggleLike(plan.id, userId, plan.liked);
    } catch {
      setRows(
        (prev) =>
          prev?.map((r) =>
            r.id === plan.id
              ? { ...r, liked: plan.liked, like_count: plan.like_count }
              : r,
          ) ?? null,
      );
      toast.error("Could not save the like.");
    }
  };

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-5xl px-5 sm:px-8">
        <section className="py-8 sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div>
            <h1 className="font-display text-3xl font-semibold">The community board</h1>
            <p className="mt-1 max-w-xl text-sm text-mute">
              Real meal plans posted by cooks here: what they had, what it cost, and what
              they ate each night. Tap the heart so they know it helped.
            </p>
          </div>
          <div className="mt-4 flex shrink-0 flex-wrap items-center gap-3 sm:mt-0">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the board..."
              aria-label="Search the community board"
              className="h-10 w-44 px-3 text-sm"
            />
           <div className="flex overflow-hidden rounded-sm border border-line" role="group" aria-label="Sort the board">
              <button
                type="button"
                aria-pressed={sort === "new"}
                onClick={() => setSort("new")}
                className={`min-h-10 px-3 text-sm font-bold transition-colors ${
                  sort === "new" ? "bg-herb text-paper" : "bg-card text-mute hover:text-herb"
                }`}
              >
                Newest
              </button>
              <button
                type="button"
                aria-pressed={sort === "loved"}
                onClick={() => setSort("loved")}
                className={`min-h-10 border-l border-line px-3 text-sm font-bold transition-colors ${
                  sort === "loved" ? "bg-herb text-paper" : "bg-card text-mute hover:text-herb"
                }`}
              >
                Most loved
              </button>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => setMineOnly(e.target.checked)}
                className="size-4 accent-[color:var(--herb)]"
              />
              Only mine
            </label>
            <Link
              href="/saved"
              className="min-h-10 rounded-sm bg-herb px-4 py-2 text-sm font-bold text-paper transition-opacity hover:opacity-90"
            >
              Share yours
            </Link>
          </div>
        </section>

        {board.length > 0 && (
          <section className="mb-6 index-card p-4" aria-label="Top cooks">
            <h2 className="font-display text-lg font-semibold">Top cooks right now</h2>
            <ol className="mt-2 flex flex-wrap gap-2">
              {board.map((cook, i) => (
                <li
                  key={cook.id}
                  className="flex items-center gap-2 rounded-full bg-paper-deep px-3 py-1.5 text-sm"
                >
                  <span className="font-display font-bold text-sun-deep">#{i + 1}</span>
                  <span className="font-bold">{cook.display_name}</span>
                  <span className="text-mute">
                    {cook.xp} xp{cook.streak_days >= 2 ? ` · ${cook.streak_days}-day streak` : ""}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {shown === null ? (
          <p className="py-8 text-sm text-mute">
            <span className="simmer">Walking the stalls...</span>
          </p>
        ) : shown.length === 0 ? (
          <div className="index-card max-w-xl p-6">
            <p className="font-display text-xl font-semibold">No posts here yet</p>
            <p className="mt-2 text-sm text-mute">
              Save a plan to your kitchen, then tap Share to put it on the board.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((plan, i) => (
              <li
                key={plan.id}
                className="animate-rise index-card flex flex-col p-4"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs text-mute">{when(plan.created_at)}</p>
                  <button
                    type="button"
                    onClick={() => void like(plan)}
                    aria-pressed={plan.liked}
                    aria-label={plan.liked ? "Unlike" : "Like"}
                    className={`flex min-h-9 items-center gap-1 rounded-full px-3 text-sm font-bold transition-colors ${
                      plan.liked
                        ? "bg-brake text-on-brake"
                        : "border border-line hover:border-brake hover:text-brake"
                    }`}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
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
                <h2 className="mt-1 font-display text-lg font-semibold">{plan.title}</h2>
                <p className="mt-1 text-sm text-mute">
                  {plan.plan.mealPlan.length} {plan.plan.mealPlan.length === 1 ? "day" : "days"} ·{" "}
                  {plan.plan.shoppingList.length} items · ~{pesos(plan.plan.financialSummary.totalEstimatedCost)}
                </p>
                <p className="mt-2 text-sm">
                  {plan.plan.mealPlan[0]?.meals?.dinner?.name ?? "—"} on the first night
                </p>
                <Link
                  href={`/community/${plan.id}`}
                  className="mt-3 min-h-10 self-start rounded-sm border border-line bg-card px-3 py-2 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
                >
                  Open the plan
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
