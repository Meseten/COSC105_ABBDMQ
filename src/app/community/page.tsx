"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { getSignedInUserId } from "@/lib/plans";
import { loadPublicPlans, toggleLike, type PublicPlan } from "@/lib/community";
import { db } from "@/lib/db";
import { useSession } from "@/lib/auth";
import { Share2, Bookmark } from "lucide-react";
import { savedPostIds, saveBoard, unsaveBoard } from "@/lib/saves";
import { pesos } from "@/lib/types";

interface LeaderRow {
  id: string;
  display_name: string;
  xp: number;
  plan_count: number;
  streak_days: number;
  is_private: boolean;
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
  const [scope, setScope] = useState<"all" | "comares" | "mine">("all");
  const [comareIds, setComareIds] = useState<Set<string>>(new Set());
  const [maxBudget, setMaxBudget] = useState(0);
  const [maxDays, setMaxDays] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "loved">("new");
  const [board, setBoard] = useState<LeaderRow[]>([]);
  const [burst, setBurst] = useState<{ id: string; key: number } | null>(null);
  const [shelved, setShelved] = useState<Set<string>>(new Set());
  const tapAt = useRef(0);

  useEffect(() => {
    if (session === undefined) return;
    let alive = true;
    void getSignedInUserId().then(async (uid) => {
      if (!alive) return;
      setUserId(uid);
      const list = await loadPublicPlans(uid, 0, sort);
      if (!alive) return;
      setRows(list);
      setShelved(await savedPostIds(list.map((l) => l.id), uid));
      const sb = db();
      if (uid) {
        void sb
          ?.from("follows")
          .select("following_id")
          .eq("follower_id", uid)
          .then(({ data }) => {
            if (alive && data) {
              setComareIds(new Set(data.map((r) => String(r.following_id))));
            }
          });
      }
      if (sb) {
        void sb
          .from("profiles")
          .select("id, display_name, xp, plan_count, streak_days, is_private")
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
    ?.filter((r) => (scope === "mine" && userId ? r.user_id === userId : true))
    .filter((r) => (scope === "comares" ? comareIds.has(r.user_id) : true))
    .filter((r) =>
      maxDays === 1
        ? r.plan.mealPlan.length === 1
        : maxDays === 2
          ? r.plan.mealPlan.length >= 2
          : true,
    )
    .filter((r) =>
      maxBudget > 0 ? r.plan.financialSummary.totalEstimatedCost <= maxBudget : true,
    )
    .filter((r) =>
      query.trim()
        ? (r.title + " " + (r.cook_name ?? ""))
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        : true,
    ) ?? null;

  // Two taps inside the window read as "heart it" like the feeds do.
  const tapCard = (plan: PublicPlan) => {
    const now = Date.now();
    if (now - tapAt.current < 400) {
      tapAt.current = 0;
      setBurst({ id: plan.id, key: now });
      if (!plan.liked) void like(plan);
      return;
    }
    tapAt.current = now;
  };

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
            <div
              className="flex overflow-hidden rounded-sm border border-line"
              role="group"
              aria-label="Whose boards to show"
            >
              {(
                [
                  ["all", "Everyone"],
                  ["comares", "Comares"],
                  ["mine", "Mine"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={scope === value}
                  onClick={() => setScope(value)}
                  className={`min-h-10 px-3 text-sm font-bold transition-colors ${
                    scope === value ? "bg-herb text-paper" : "bg-card text-mute hover:text-herb"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              aria-label="Filter by budget"
              className="h-10 px-2 text-sm"
            >
              <option value={0}>Any budget</option>
              <option value={500}>Under ₱500</option>
              <option value={1000}>Under ₱1,000</option>
            </select>
            <select
              value={maxDays}
              onChange={(e) => setMaxDays(Number(e.target.value))}
              aria-label="Filter by days"
              className="h-10 px-2 text-sm"
            >
              <option value={0}>Any days</option>
              <option value={1}>One day</option>
              <option value={2}>Two days or more</option>
            </select>
            <Link
              href="/friends"
              className="min-h-10 rounded-sm border border-line bg-card px-4 py-2 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
            >
              My comares
            </Link>
            <Link
              href="/saved"
              className="min-h-10 rounded-sm bg-herb px-4 py-2 text-sm font-bold text-paper transition-opacity hover:opacity-90"
            >
              Share yours
            </Link>
          </div>
        </section>

        {board.length > 0 && (
          <section className="mb-6" aria-label="Top cooks">
            <ul className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
            {board.map((cook) => (
              <li key={cook.id} className="w-[72px] shrink-0">
                <Link
                  href={`/cooks/${cook.id}`}
                  title={`${cook.display_name} · open their kitchen`}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <span className="story-ring block rounded-full p-[2.5px] transition-transform group-hover:scale-105 group-focus-visible:scale-105">
                    <span className="flex size-[52px] items-center justify-center rounded-full bg-paper-deep font-display text-lg font-bold">
                      {(cook.display_name || "?").slice(0, 1).toUpperCase()}
                    </span>
                  </span>
                  <span className="block w-[68px] truncate text-center text-[11px] font-bold text-mute">
                    {cook.display_name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
            <p className="mt-1 text-[11px] text-mute">
              Tap a cook to open their kitchen, then follow them for their next boards.
            </p>
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
                onClick={() => tapCard(plan)}
                className="animate-rise index-card relative flex flex-col p-4"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                {burst?.id === plan.id && (
                  <span
                    key={burst.key}
                    aria-hidden="true"
                    className="heart-pop pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                  >
                    <svg viewBox="0 0 16 16" className="size-20 text-brake">
                      <path
                        d="M8 13.6C4.6 11 2.4 8.9 2.4 6.3 2.4 4.5 3.8 3.2 5.4 3.2c1 0 2 .5 2.6 1.4.6-.9 1.6-1.4 2.6-1.4 1.6 0 3 1.3 3 3.1 0 2.6-2.2 4.7-5.6 7.3Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                )}
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/cooks/${plan.user_id}`}
                    className="flex min-w-0 items-center gap-2"
                    title="Open their kitchen"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-paper-deep text-xs font-bold"
                    >
                      {(plan.cook_name || "?").slice(0, 1).toUpperCase()}
                    </span>
                    <span className="truncate text-xs font-bold hover:text-herb">
                      {plan.cook_name ?? "A cook here"}
                    </span>
                  </Link>
                  <p className="shrink-0 text-xs text-mute">{when(plan.created_at)}</p>
                </div>
                <h2 className="mt-2 font-display text-lg font-semibold">{plan.title}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-mute">
                  {plan.visibility === "buddies" && (
                    <span className="flex items-center gap-1 rounded bg-paper-deep px-1.5 py-0.5 text-[10px] font-bold text-sun">
                      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3">
                        <path
                          d="M5 6.5V4.8a3 3 0 0 1 6 0v1.7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
                        />
                        <rect x="3.6" y="6.5" width="8.8" height="6.4" rx="1.4" fill="currentColor" />
                      </svg>
                      comares only
                    </span>
                  )}
                  {plan.plan.mealPlan.length} {plan.plan.mealPlan.length === 1 ? "day" : "days"} ·{" "}
                  {plan.plan.shoppingList.length} items · ~{pesos(plan.plan.financialSummary.totalEstimatedCost)}
                </p>
                <p className="mt-2 text-sm">
                  {plan.plan.mealPlan[0]?.meals?.dinner?.name ?? "Nothing set yet"} on the first night
                </p>
                {plan.photo_url && (
                  <img
                    src={plan.photo_url}
                    alt={`Photo of ${plan.title}`}
                    loading="lazy"
                    className="mt-2 h-36 w-full rounded-sm object-cover"
                  />
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
                    aria-label={`Share the link to ${plan.title}`}
                    onClick={() => {
                      navigator.clipboard
                        .writeText(`${window.location.origin}/community/${plan.id}`)
                        .then(() => toast.success("Link copied. Pass it around."))
                        .catch(() => toast.error("The browser blocked the copy."));
                    }}
                    className="flex min-h-10 w-10 items-center justify-center rounded-sm border border-line bg-card text-sm transition-colors hover:border-herb hover:text-herb"
                  >
                    <Share2 className="size-4" aria-hidden="true" />
                  </button>
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
                  {userId && userId !== plan.user_id && (
                    <button
                      type="button"
                      onClick={async () => {
                        const was = shelved.has(plan.id);
                        // optimistic shelf flip
                        setShelved((prev) => {
                          const next = new Set(prev);
                          if (was) next.delete(plan.id);
                          else next.add(plan.id);
                          return next;
                        });
                        try {
                          if (was) await unsaveBoard(plan.id, userId);
                          else await saveBoard(plan, userId);
                          toast.success(
                            was ? "Taken off the shelf." : "On your want-to-try shelf.",
                          );
                        } catch {
                          toast.error("Could not save that.");
                          setShelved((prev) => {
                            const next = new Set(prev);
                            if (was) next.delete(plan.id);
                            else next.add(plan.id);
                            return next;
                          });
                        }
                      }}
                      aria-pressed={shelved.has(plan.id)}
                      aria-label={shelved.has(plan.id) ? "Take off the shelf" : "Save to try"}
                      title={shelved.has(plan.id) ? "On your want-to-try shelf" : "Save to try"}
                      className={`flex min-h-10 w-10 items-center justify-center rounded-sm border text-sm transition-colors ${
                        shelved.has(plan.id)
                          ? "border-sun bg-sun text-on-brake"
                          : "border-line hover:border-sun hover:text-sun-deep"
                      }`}
                    >
                      <Bookmark
                        className="size-4"
                        aria-hidden="true"
                        fill={shelved.has(plan.id) ? "currentColor" : "none"}
                      />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
