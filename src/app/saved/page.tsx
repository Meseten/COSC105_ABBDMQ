"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import PlanView from "@/components/PlanView";
import { deletePlan, loadPlans, planToText, setPinned } from "@/lib/plans";
import { Pin } from "lucide-react";
import { sharePlan } from "@/lib/community";
import { useSession } from "@/lib/auth";
import { getSignedInUserId } from "@/lib/plans";
import { loadSavedBoards, unsaveBoard } from "@/lib/saves";
import { photoProblem, uploadPhoto } from "@/lib/photos";
import type { PublicPlan } from "@/lib/community";
import { pesos, type SavedPlan } from "@/lib/types";

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function downloadText(name: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Boards by other cooks I bookmarked to try some week. */
function ToTryShelf() {
  const [rows, setRows] = useState<PublicPlan[] | null>(null);

  useEffect(() => {
    let alive = true;
    void getSignedInUserId().then(async (uid: string | null) => {
      if (uid && alive) setRows(await loadSavedBoards(uid));
      else if (alive) setRows([]);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (rows === null) return null;
  if (rows.length === 0) return null;

  return (
    <section className="mt-8" aria-label="Boards to try">
      <h2 className="font-display text-xl font-semibold">Boards to try</h2>
      <p className="mt-1 text-xs text-mute">
        Other cooks you saved while browsing the community board.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {rows.map((b) => (
          <li key={b.id} className="index-card flex items-center justify-between gap-2 p-3">
            <div className="min-w-0">
              <Link
                href={`/community/${b.id}`}
                className="font-display font-semibold transition-colors hover:text-herb"
              >
                {b.title}
              </Link>
              <p className="truncate text-xs text-mute">
                {b.cook_name ?? "A cook"} · {b.plan.mealPlan.length} days ·{" "}
                ~{pesos(b.plan.financialSummary.totalEstimatedCost)}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Drop ${b.title} from the shelf`}
              onClick={async () => {
                try {
                  const uid = await getSignedInUserId();
                  if (uid) await unsaveBoard(b.id, uid);
                  setRows((prev) => (prev ?? []).filter((r) => r.id !== b.id));
                } catch {
                  /* shelf just keeps it this time */
                }
              }}
              className="min-h-10 shrink-0 rounded-sm border border-line px-3 text-xs font-bold text-mute transition-colors hover:border-brake hover:text-brake"
            >
              Drop
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SavedPage() {
  const session = useSession();
  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const [plans, setPlans] = useState<SavedPlan[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [shareVisibility, setShareVisibility] = useState<"public" | "buddies">("public");
  const [sharePhoto, setSharePhoto] = useState<File | null>(null);
  const [sharePreview, setSharePreview] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (session === undefined) return;
    let alive = true;
    setPlans(null);
    void loadPlans().then((list) => {
      if (alive) setPlans(list);
    });
    return () => {
      alive = false;
    };
  }, [session]);

  const refresh = () => {
    setPlans(null);
    void loadPlans().then(setPlans);
  };

  const resetSharePhoto = () => {
    if (sharePreview) URL.revokeObjectURL(sharePreview);
    setSharePhoto(null);
    setSharePreview(null);
  };

  const doShare = async (saved: SavedPlan) => {
    try {
      let photoUrl: string | undefined;
      if (sharePhoto) {
        const uid = await getSignedInUserId();
        if (!uid) throw new Error("Sign in first to attach a photo.");
        photoUrl = await uploadPhoto(uid, sharePhoto);
      }
      const id = await sharePlan(saved.plan, shareTitle, shareVisibility, photoUrl);
      setSharing(null);
      setShareTitle("");
      resetSharePhoto();
      toast.success(
        shareVisibility === "buddies"
          ? "Posted for your comares only."
          : "Posted on the community board.",
      );
      window.open(`/community/${id}`, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not share the plan.");
    }
  };

  const togglePin = async (saved: SavedPlan) => {
    const next = !saved.pinned;
    setPlans((cur) =>
      cur
        ? [...cur.map((p) => (p.id === saved.id ? { ...p, pinned: next } : p))].sort(
            (a, b) =>
              Number(b.pinned ?? false) - Number(a.pinned ?? false) ||
              b.createdAt.localeCompare(a.createdAt),
          )
        : cur,
    );
    await setPinned(saved.id, next);
    toast.success(next ? "Pinned to the top of the board." : "Unpinned.");
  };

  const open = plans?.find((p) => p.id === openId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? (plans ?? []).filter((p) => p.title.toLowerCase().includes(q)) : plans ?? [];
  }, [plans, query]);

  const stats = useMemo(() => {
    const list = plans ?? [];
    const days = list.reduce((acc, p) => acc + p.plan.mealPlan.length, 0);
    const total = list.reduce((acc, p) => acc + p.plan.financialSummary.totalEstimatedCost, 0);
    const pinned = list.filter((p) => p.pinned).length;
    return { count: list.length, days, total, pinned };
  }, [plans]);

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-5xl px-5 sm:px-8">
        <section className="py-8">
          <h1 className="font-display text-3xl font-semibold">Your kitchen</h1>
          <p className="mt-1 text-sm text-mute">
            Every plan is a note pinned to the board, sorted the way a real line
            runs: tonight&apos;s work floats, the rest stacks below.{" "}
            {signedIn
              ? "Signed-in, so the board also syncs to your account."
              : "Not signed in, so the board lives on this device only."}{" "}
            <Link href="/login" className="font-bold text-herb underline underline-offset-4">
              {signedIn ? "Profile" : "Sign in to sync"}
            </Link>
          </p>
          {stats.count > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded bg-paper-deep px-3 py-1.5 font-bold">
                {stats.count} {stats.count === 1 ? "plan" : "plans"} on the board
              </span>
              <span className="rounded bg-paper-deep px-3 py-1.5 font-bold">
                {stats.days} {stats.days === 1 ? "day" : "days"} of meals drafted
              </span>
              <span className="rounded bg-paper-deep px-3 py-1.5 font-bold text-sun-deep">
                ~{pesos(stats.total)} planned all-time
              </span>
              {stats.pinned > 0 && (
                <span className="rounded bg-paper-deep px-3 py-1.5 font-bold text-herb">
                  {stats.pinned} pinned
                </span>
              )}
            </div>
          )}
        </section>

        {plans !== null && plans.length > 1 && (
          <label className="mb-4 flex flex-col gap-1 text-sm font-bold">
            <span className="sr-only">Search your plans</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the board: “adobo”, “week for two”…"
              className="h-11 px-3 text-base font-normal"
            />
          </label>
        )}

        {plans === null ? (
          <p className="py-8 text-sm text-mute">
            <span className="simmer">Prepping the kitchen...</span>
          </p>
        ) : plans.length === 0 ? (
          <div className="index-card max-w-xl p-6">
            <p className="font-display text-xl font-semibold">The kitchen is empty</p>
            <p className="mt-2 text-sm text-mute">
              Make a plan on the home page and hit “Save to my board”. Each note keeps
              its shopping list, budget fit and the pantry you gave it.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-sm bg-brake px-5 py-3 text-sm font-bold text-on-brake transition-opacity hover:opacity-90"
            >
              Write my first plan
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-sm text-mute">
            Nothing on the board matches “{query}”.
          </p>
        ) : (
          <div className="shelf-wood rounded-md p-4 pt-5">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((saved) => (
                <li
                  key={saved.id}
                  className={`animate-rise index-card flex flex-col p-4 transition-transform hover:-translate-y-0.5 ${
                    saved.pinned ? "border-sun bg-sun/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-mute">{fmtDate(saved.createdAt)}</p>
                    <button
                      type="button"
                      aria-pressed={Boolean(saved.pinned)}
                      aria-label={saved.pinned ? `Unpin ${saved.title}` : `Pin ${saved.title}`}
                      title={saved.pinned ? "Unpin" : "Pin to top"}
                      onClick={() => void togglePin(saved)}
                      className={`flex size-8 items-center justify-center rounded-full transition-colors ${
                        saved.pinned ? "bg-sun text-ink" : "bg-paper-deep text-mute hover:text-ink"
                      }`}
                    >
                      <Pin
                        className={`size-4 ${saved.pinned ? "" : "-rotate-45 opacity-70"}`}
                        aria-hidden="true"
                        {...(saved.pinned ? { fill: "currentColor" } : {})}
                      />
                    </button>
                  </div>
                  <h2 className="mt-1 font-display text-lg font-semibold">
                    {saved.title}
                    {saved.pinned && (
                      <span className="ml-2 align-middle text-[10px] font-bold tracking-wide text-sun-deep uppercase">
                        pinned
                      </span>
                    )}
                  </h2>
                  <p className="mt-1 text-sm text-mute">
                    {saved.plan.mealPlan.length}{" "}
                    {saved.plan.mealPlan.length === 1 ? "day" : "days"} ·{" "}
                    {saved.plan.shoppingList.length} items on the list
                  </p>
                  <p className="mt-1 text-sm font-bold text-sun-deep">
                    ~{pesos(saved.plan.financialSummary.totalEstimatedCost)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenId(saved.id)}
                      className="min-h-10 rounded-sm border border-line bg-card px-3 py-2 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
                    >
                      Open
                    </button>
                    {signedIn && (
                      <button
                        type="button"
                        onClick={() => {
                          setSharing(saved.id);
                          setShareTitle(saved.title);
                        }}
                        className="min-h-10 rounded-sm px-3 py-2 text-sm font-bold text-herb transition-colors hover:bg-paper-deep"
                      >
                        Share
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        downloadText(
                          `${saved.title.replace(/[^\w-]+/g, "-")}.txt`,
                          planToText(saved),
                        );
                        toast.success("Saved the note as a text file.");
                      }}
                      className="min-h-10 rounded-sm px-3 py-2 text-sm font-bold text-mute transition-colors hover:text-ink"
                    >
                      Export
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deletePlan(saved.id);
                        toast.success("Torn off the board.");
                        refresh();
                      }}
                      className="min-h-10 rounded-sm px-3 py-2 text-sm font-bold text-brake transition-colors hover:bg-paper-deep"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {signedIn && <ToTryShelf />}
      </main>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenId(null);
          }}
        >
          <div className="mx-auto my-6 max-w-3xl px-4">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded bg-card px-4 py-2 text-sm font-bold shadow"
              >
                Close
              </button>
            </div>
            <PlanView plan={open.plan} />
          </div>
        </div>
      )}

      {sharing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share plan"
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSharing(null);
          }}
        >
          <div className="index-card animate-pop w-full max-w-sm p-5">
            <h2 className="font-display text-xl font-semibold">Post to the community board</h2>
            <label className="mt-3 block text-sm font-bold" htmlFor="share-title">
              Title it
            </label>
            <input
              id="share-title"
              type="text"
              value={shareTitle}
              maxLength={80}
              onChange={(e) => setShareTitle(e.target.value)}
              className="mt-1 h-11 w-full px-3 text-base font-normal"
              placeholder="Week of adobo and eggs"
            />
            <fieldset className="mt-4">
              <legend className="text-sm font-bold">Who sees this post</legend>
              <div className="mt-2 flex gap-2">
                <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm border px-3 text-sm font-bold has-[:checked]:border-herb has-[:checked]:bg-paper-deep">
                  <input
                    type="radio"
                    name="share-visibility"
                    value="public"
                    checked={shareVisibility === "public"}
                    onChange={() => setShareVisibility("public")}
                    className="size-4 accent-[color:var(--herb)]"
                  />
                  Everyone
                </label>
                <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm border px-3 text-sm font-bold has-[:checked]:border-herb has-[:checked]:bg-paper-deep">
                  <input
                    type="radio"
                    name="share-visibility"
                    value="buddies"
                    checked={shareVisibility === "buddies"}
                    onChange={() => setShareVisibility("buddies")}
                    className="size-4 accent-[color:var(--herb)]"
                  />
                  Comares only
                </label>
              </div>
              <p className="mt-1.5 text-xs text-mute">
                Comare-only posts are visible to the cooks who follow you, everyone else
                scrolls right past.
              </p>
            </fieldset>
            <div className="mt-4">
              <label className="text-sm font-bold" htmlFor="share-photo">
                Show the dish (optional)
              </label>
              <input
                id="share-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="mt-1 h-11 w-full border border-line bg-card px-3 py-2 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-paper-deep file:px-2 file:py-1 file:text-sm file:font-bold"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) {
                    resetSharePhoto();
                    return;
                  }
                  const problem = photoProblem(file);
                  if (problem) {
                    toast.error(problem);
                    e.target.value = "";
                    return;
                  }
                  if (sharePreview) URL.revokeObjectURL(sharePreview);
                  setSharePhoto(file);
                  setSharePreview(URL.createObjectURL(file));
                }}
              />
              {sharePreview && (
                <img
                  src={sharePreview}
                  alt="Photo you picked for this post"
                  className="mt-2 max-h-40 w-full rounded-sm object-cover"
                />
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const saved = plans?.find((p) => p.id === sharing);
                  if (saved && shareTitle.trim().length >= 3) void doShare(saved);
                  else
                    toast.error("Give the post a title of at least 3 characters first.");
                }}
                className="min-h-11 flex-1 rounded-sm bg-brake px-4 py-2 text-sm font-bold text-on-brake"
              >
                Post it
              </button>
              <button
                type="button"
                onClick={() => setSharing(null)}
                className="min-h-11 rounded-sm border border-line px-4 py-2 text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
