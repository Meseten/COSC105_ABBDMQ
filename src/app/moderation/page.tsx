"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";
import toast from "react-hot-toast";
import { ShieldOff } from "lucide-react";
import { useProfile, useSession } from "@/lib/auth";
import { loadReports, dismissReport, type ReportRow } from "@/lib/reports";
import { deleteSharedPlan } from "@/lib/community";
import { deleteComment } from "@/lib/comments";
import { getSignedInUserId } from "@/lib/plans";

export default function ModerationPage() {
  const session = useSession();
  const { profile } = useProfile();
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const steward = profile?.role === "admin" || profile?.role === "moderator";

  useEffect(() => {
    void getSignedInUserId().then(setUserId);
  }, []);

  const refresh = useCallback(async () => {
    setRows(null);
    setRows(await loadReports());
  }, []);

  useEffect(() => {
    if (steward) void refresh();
  }, [steward, refresh]);

  if (session === undefined) {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-xl px-5 py-16">
          <BackButton />
          <p className="mt-4 text-sm text-mute">Warming the kettle...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!signedIn || !steward) {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-xl px-5 py-16 text-center">
          <h1 className="font-display text-3xl font-semibold">Stewards only</h1>
          <p className="mt-2 text-sm text-mute">
            The queue sits behind the moderator and admin roles. Everyone else
            keeps cooking.
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

  const when = (iso: string) =>
    new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));

  const dismiss = async (id: string) => {
    try {
      await dismissReport(id);
      void refresh();
      toast.success("Report closed, the post stays up.");
    } catch {
      toast.error("Could not close that report.");
    }
  };

  const removePost = async (id: string, postId: string) => {
    if (!userId) return;
    setBusy(id);
    try {
      await deleteSharedPlan(postId, userId);
      void refresh();
      toast.success("Board removed with its reports.");
    } catch {
      toast.error("Could not remove that board.");
    } finally {
      setBusy(null);
    }
  };

  const removeComment = async (id: string, commentId: string) => {
    setBusy(id);
    try {
      await deleteComment(commentId);
      void refresh();
      toast.success("Chika removed with its report.");
    } catch {
      toast.error("Could not remove that chika.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-2xl px-5 pb-16 sm:px-8">
        <div className="mt-6">
          <BackButton />
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold">Steward&apos;s desk</h1>
        <p className="mt-2 text-sm text-mute">
          Flags poured by the cooks. Removing a board or a chika clears its
          reports on its own.
        </p>

        {rows === null ? (
          <p className="mt-6 text-sm text-mute">Opening the desk...</p>
        ) : rows.length === 0 ? (
          <section className="index-card mt-6 p-5 text-center">
            <ShieldOff className="mx-auto size-7 text-mute" aria-hidden="true" />
            <p className="mt-2 text-sm text-mute">
              The tray is empty. The house rules are being followed.
            </p>
          </section>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="index-card p-4">
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-mute">
                  <span className="font-bold uppercase tracking-wide text-sun-deep">
                    {r.post_id ? "Board" : "Chika"}
                  </span>
                  <span>· {r.reporter_name ?? "A cook"}</span>
                  <span>· {when(r.created_at)}</span>
                </div>
                <p className="mt-1.5 text-sm font-bold">“{r.reason}”</p>
                {r.post_id && (
                  <p className="mt-2 break-words text-sm">
                    <Link
                      href={`/community/${r.post_id}`}
                      className="font-bold text-herb hover:underline"
                    >
                      {r.post_title ?? "Open the board"}
                    </Link>
                  </p>
                )}
                {r.comment_id && (
                  <p className="mt-2 break-words text-sm">
                    {r.comment_body ?? "The chika is gone already."}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void dismiss(r.id)}
                    className="min-h-10 rounded-sm border border-line px-4 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
                  >
                    Keep it up
                  </button>
                  {r.post_id && userId && (
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => void removePost(r.id, r.post_id!)}
                      className="min-h-10 rounded-sm bg-brake px-4 text-sm font-bold text-on-brake transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      Remove board
                    </button>
                  )}
                  {r.comment_id && (
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => void removeComment(r.id, r.comment_id!)}
                      className="min-h-10 rounded-sm bg-brake px-4 text-sm font-bold text-on-brake transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      Remove chika
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
