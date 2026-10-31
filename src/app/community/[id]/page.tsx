"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import PlanView from "@/components/PlanView";
import { getSignedInUserId, savePlan } from "@/lib/plans";
import { deleteSharedPlan, loadOnePublicPlan, toggleLike, type PublicPlan } from "@/lib/community";
import { fetchProfile, useSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default function SharedPlanPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const session = useSession();
  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const [plan, setPlan] = useState<PublicPlan | null>(null);
  const [missing, setMissing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [cook, setCook] = useState<string | null>(null);
  const [canModerate, setCanModerate] = useState(false);

  useEffect(() => {
    if (session === undefined || !id) return;
    let alive = true;
    void getSignedInUserId().then(async (uid) => {
      if (!alive) return;
      setUserId(uid);
      const row = await loadOnePublicPlan(id, uid);
      if (!alive) return;
      if (!row) {
        setMissing(true);
        return;
      }
      setPlan(row);
      if (uid) {
        const me = await fetchProfile(uid);
        if (alive) setCanModerate(me?.role === "admin" || me?.role === "moderator");
      }
    });
    return () => {
      alive = false;
    };
  }, [session, id]);

  useEffect(() => {
    if (!plan) return;
    const sb = db();
    if (!sb) return;
    let alive = true;
    void sb
      .from("profiles")
      .select("display_name")
      .eq("id", plan.user_id)
      .maybeSingle()
      .then(({ data }) => {
        if (alive && data) setCook(String((data as { display_name?: string }).display_name ?? "a cook"));
      });
    return () => {
      alive = false;
    };
  }, [plan]);

  const router = useRouter();

  const like = async () => {
    if (!plan) return;
    if (!signedIn || !userId) {
      toast.error("Sign in to like recipes.");
      return;
    }
    setPlan({ ...plan, liked: !plan.liked, like_count: plan.like_count + (plan.liked ? -1 : 1) });
    try {
      await toggleLike(plan.id, userId, plan.liked);
    } catch {
      toast.error("Could not save the like.");
    }
  };

  if (missing) {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-xl px-5 py-16 text-center">
          <h1 className="font-display text-3xl font-semibold">This post is gone</h1>
          <p className="mt-2 text-sm text-mute">The cook removed it, or the link is wrong.</p>
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

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-3xl px-5 sm:px-8">
        {plan === null ? (
          <p className="py-10 text-sm text-mute">
            <span className="simmer">Unfolding the recipe...</span>
          </p>
        ) : (
          <section className="py-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h1 className="font-display text-3xl font-semibold">{plan.title}</h1>
              <button
                type="button"
                onClick={() => void like()}
                aria-pressed={plan.liked}
                className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors ${
                  plan.liked
                    ? "bg-brake text-on-brake"
                    : "border border-line hover:border-brake hover:text-brake"
                }`}
              >
                {plan.liked ? "Liked" : "Like"} · {plan.like_count}
              </button>
            </div>
            <p className="mt-1 text-sm text-mute">
              Shared by {cook ?? "a cook"} ·{" "}
              {new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(
                new Date(plan.created_at),
              )}
            </p>

            {(userId === plan.user_id || canModerate) && (
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("Remove this post from the community board?")) return;
                  await deleteSharedPlan(plan.id, userId!);
                  toast.success("Post removed.");
                  router.push("/community");
                }}
                className="mt-3 min-h-10 rounded-sm border border-line px-4 py-2 text-sm font-bold text-brake transition-colors hover:border-brake"
              >
                {userId === plan.user_id ? "Delete my post" : "Moderate: remove post"}
              </button>
            )}
            {signedIn && (
              <button
                type="button"
                onClick={async () => {
                  await savePlan(plan.plan);
                  toast.success("Copied to your kitchen.");
                }}
                className="mt-3 min-h-10 rounded-sm border border-herb px-4 py-2 text-sm font-bold text-herb transition-colors hover:bg-herb hover:text-paper"
              >
                Copy to my kitchen
              </button>
            )}

            <div className="mt-6">
              <PlanView plan={plan.plan} />
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
