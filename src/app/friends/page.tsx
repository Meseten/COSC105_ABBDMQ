"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Masthead from "@/components/Masthead";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";
import { getSignedInUserId } from "@/lib/plans";
import {
  loadFollowers,
  loadFollowing,
  loadSuggestions,
  setFollowing,
  type CookRow,
} from "@/lib/social";
import { useSession } from "@/lib/auth";
import { Lock, UserPlus } from "lucide-react";

type Tab = "discover" | "crew" | "followers";

function CookCard({
  cook,
  onFollow,
}: {
  cook: CookRow;
  onFollow: (cook: CookRow) => void;
}) {
  return (
    <li className="index-card flex items-center gap-3 p-4">
      <Link
        href={`/cooks/${cook.id}`}
        className="story-ring block shrink-0 rounded-full p-[2px]"
        title={`Open ${cook.display_name}'s kitchen`}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-paper-deep font-display text-base font-bold">
          {cook.display_name.slice(0, 1).toUpperCase()}
        </span>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/cooks/${cook.id}`} className="block truncate text-sm font-bold hover:text-herb">
          {cook.display_name}
        </Link>
        <p className="truncate text-xs text-mute">
          {cook.plan_count} {cook.plan_count === 1 ? "board" : "boards"} ·{" "}
          {cook.plan_count === 1 ? "it" : "they"} fed people ·{" "}
          {cook.is_private ? "private kitchen" : "open kitchen"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onFollow(cook)}
        aria-label={`Follow ${cook.display_name}`}
        className="min-h-10 shrink-0 rounded-sm px-4 text-sm font-bold text-paper transition-colors hover:opacity-90 bg-herb"
        title={`Follow ${cook.display_name}`}
      >
        <UserPlus className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export default function FriendsPage() {
  const session = useSession();
  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const [tab, setTab] = useState<Tab>("discover");
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<CookRow[] | null>(null);

  useEffect(() => {
    void getSignedInUserId().then(setUserId);
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!signedIn) {
      setRows(null);
      return;
    }
    setRows(null);
    let alive = true;
    if (tab === "discover") void loadSuggestions(userId, 24).then((r) => alive && setRows(r));
    else if (!userId) void loadSuggestions(null, 24).then((r) => alive && setRows(r));
    else if (tab === "followers") void loadFollowers(userId).then((r) => alive && setRows(r));
    else void loadFollowing(userId).then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, [session, tab, userId, signedIn]);

  const follow = async (cook: CookRow) => {
    if (!userId) {
      toast.error("Sign in to build your comares.");
      return;
    }
    try {
      await setFollowing(userId, cook.id, true);
      setRows((prev) => prev?.filter((r) => r.id !== cook.id) ?? prev);
      toast.success(`Added ${cook.display_name} to your comares.`);
    } catch {
      toast.error("Could not save that, the kitchen hiccuped.");
    }
  };

  const removeFollow = async (cook: CookRow) => {
    if (!userId) return;
    try {
      await setFollowing(userId, cook.id, false);
      if (tab === "crew") setRows((prev) => prev?.filter((r) => r.id !== cook.id) ?? prev);
      toast.success(`Unfollowed ${cook.display_name}.`);
    } catch {
      toast.error("Could not save that, the kitchen hiccuped.");
    }
  };

  if (!signedIn) {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-xl px-5 py-16 text-center">
          <BackButton fallbackHref="/" label="Back to the planner" />
          <br />
          <h1 className="mt-4 font-display text-3xl font-semibold">Meet your comares</h1>
          <p className="mt-2 text-sm text-mute">
            Follow cooks you like, see their boards first, and pick who gets to see your
            kitchen when it is private.
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

  const TAB_INFO: { key: Tab; label: string }[] = [
    { key: "discover", label: "Kitchens to peek" },
    { key: "crew", label: "My comares" },
    { key: "followers", label: "They follow me" },
  ];

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-2xl px-5 sm:px-8">
        <div className="pt-6">
          <BackButton fallbackHref="/profile" label="Back to your profile" />
        </div>
        <section className="py-6">
          <h1 className="font-display text-3xl font-semibold">Your comares</h1>
          <p className="mt-1 max-w-lg text-sm text-mute">
            The cooks you keep up with, the ones keeping up with you, and kitchens worth a
            peek when you feel like wandering.
          </p>
          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Cook lists">
            {TAB_INFO.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`min-h-10 rounded-sm border px-4 text-sm font-bold transition-colors ${
                  tab === t.key
                    ? "border-herb bg-herb text-paper"
                    : "border-line bg-card text-mute hover:text-herb"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {rows === null ? (
          <p className="py-8 text-sm text-mute">
            <span className="simmer">Knocking on kitchens...</span>
          </p>
        ) : rows.length === 0 ? (
          <section className="index-card max-w-xl p-6">
            {tab === "discover" ? (
              <>
                <p className="font-display text-xl font-semibold">Every kitchen is idle</p>
                <p className="mt-2 text-sm text-mute">
                  No active cooks right now. When people plan meals, they surface here with
                  a follow button.
                </p>
              </>
            ) : tab === "crew" ? (
              <>
                <p className="font-display text-xl font-semibold">No one in your comares yet</p>
                <p className="mt-2 text-sm text-mute">
                  Flip to the first tab and follow a cook or two. Their boards land on the
                  community feed.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-xl font-semibold">Quiet week on your board</p>
                <p className="mt-2 text-sm text-mute">
                  Nobody follows you yet. Share a plan and the board does the talking.
                </p>
              </>
            )}
          </section>
        ) : (
          <>
            <ul className="grid gap-3 pb-6">
              {tab === "crew"
                ? (rows as CookRow[]).map((cook) => (
                    <li key={cook.id} className="index-card flex items-center gap-3 p-4">
                      <Link
                        href={`/cooks/${cook.id}`}
                        className="story-ring block shrink-0 rounded-full p-[2px]"
                      >
                        <span className="flex size-11 items-center justify-center rounded-full bg-paper-deep font-display text-base font-bold">
                          {cook.display_name.slice(0, 1).toUpperCase()}
                        </span>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/cooks/${cook.id}`}
                          className="block truncate text-sm font-bold hover:text-herb"
                        >
                          {cook.display_name}
                        </Link>
                        <p className="truncate text-xs text-mute">
                          following · {cook.is_private ? "private kitchen" : "open kitchen"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeFollow(cook)}
                        className="min-h-10 shrink-0 rounded-sm border border-line px-4 text-sm font-bold transition-colors hover:border-brake hover:text-brake"
                      >
                        Following
                      </button>
                    </li>
                  ))
                : rows.map((cook) => (
                    <CookCard key={cook.id} cook={cook} onFollow={(c) => void follow(c)} />
                  ))}
            </ul>
            {tab === "crew" && (
              <p className="mb-8 flex items-center gap-1.5 text-xs text-mute">
                <Lock className="size-3" aria-hidden="true" />
                Followers matter only when a kitchen is private, then followers get past the
                curtain.
              </p>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
