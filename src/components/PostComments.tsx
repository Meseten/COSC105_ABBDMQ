"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import {
  addComment,
  deleteComment,
  loadComments,
  type CommentRow,
} from "@/lib/comments";
import { useSession } from "@/lib/auth";
import { getSignedInUserId } from "@/lib/plans";

export default function PostComments({ postId }: { postId: string }) {
  const session = useSession();
  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<CommentRow[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void getSignedInUserId().then(setUserId);
  }, []);

  const refresh = useCallback(async () => {
    setRows(await loadComments(postId));
  }, [postId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const when = (iso: string) =>
    new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));

  const send = async () => {
    if (!signedIn || sending) return;
    setSending(true);
    try {
      await addComment(postId, userId!, draft);
      setDraft("");
      void refresh();
      toast.success("Said it.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post that.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-label="Comments" className="mt-8">
      <h2 className="font-display text-xl font-semibold">
        Chimes {rows ? `(${rows.length})` : ""}
      </h2>

      {rows !== null && rows.length > 0 && (
        <ul className="mt-3 space-y-2">
          {rows.map((c) => {
            const mine = userId === c.user_id;
            return (
              <li
                key={c.id}
                className="index-card flex items-start gap-2.5 p-3"
              >
                <Link
                  href={`/cooks/${c.user_id}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-paper-deep text-xs font-bold text-mute transition-colors hover:text-herb"
                  title={`${c.cook_name ?? "A cook"} · open their kitchen`}
                >
                  {(c.cook_name ?? "?").slice(0, 1).toUpperCase()}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <Link
                      href={`/cooks/${c.user_id}`}
                      className="font-bold transition-colors hover:text-herb"
                    >
                      {c.cook_name ?? "A cook"}
                    </Link>{" "}
                    <span className="text-mute">· {when(c.created_at)}</span>
                  </p>
                  <p className="mt-0.5 break-words text-sm">{c.body}</p>
                </div>
                {mine && (
                  <button
                    type="button"
                    aria-label="Delete this comment"
                    title="Delete this comment"
                    onClick={async () => {
                      try {
                        await deleteComment(c.id);
                        void refresh();
                        toast.success("Taken back.");
                      } catch {
                        toast.error("Could not take that back.");
                      }
                    }}
                    className="flex size-9 shrink-0 items-center justify-center rounded-sm text-mute transition-colors hover:bg-brake hover:text-on-brake"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {rows === null && (
        <p className="mt-3 text-sm text-mute">Gathering the replies...</p>
      )}

      {rows !== null && rows.length === 0 && (
        <p className="mt-3 text-sm text-mute">
          No replies yet. Be the first to say you are trying this.
        </p>
      )}

      {signedIn ? (
        <div className="mt-3 flex items-end gap-2">
          <label className="flex-1">
            <span className="sr-only">Write a reply</span>
            <textarea
              value={draft}
              rows={2}
              maxLength={500}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Say something nice (or hungry)."
              className="min-h-16 w-full px-3 py-2 text-base font-normal"
              aria-label="Write a reply"
            />
          </label>
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || draft.trim().length === 0}
            className="min-h-11 rounded-sm bg-herb px-4 text-sm font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Reply
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-mute">
          <Link href="/login" className="font-bold text-herb hover:underline">
            Sign in
          </Link>{" "}
          to join the chime.
        </p>
      )}
    </section>
  );
}
