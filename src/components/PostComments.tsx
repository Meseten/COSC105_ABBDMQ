"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { CornerDownRight, Pencil, Trash2, X } from "lucide-react";
import {
  addComment,
  deleteComment,
  loadComments,
  updateComment,
  type CommentRow,
} from "@/lib/comments";
import { useSession } from "@/lib/auth";
import { getSignedInUserId } from "@/lib/plans";
import { photoProblem, uploadPhoto } from "@/lib/photos";
import ReportButton from "./ReportButton";

function ChikaCard({
  c,
  userId,
  parentName,
  onReply,
  onEdited,
  onDeleted,
  indent,
}: {
  c: CommentRow;
  userId: string | null;
  parentName?: string | null;
  onReply: (c: CommentRow) => void;
  onEdited: () => void;
  onDeleted: () => void;
  indent?: boolean;
}) {
  const mine = userId === c.user_id;
  const when = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(c.created_at));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.body);
  const [saving, setSaving] = useState(false);
  // a quarter hour to catch the typos, then it is spoken for
  const editable =
    mine && Date.now() - new Date(c.created_at).getTime() < 15 * 60 * 1000;

  return (
    <li
      className={`flex items-start gap-2.5 border border-line bg-card p-3 ${
        indent ? "ml-6" : "rounded-sm"
      }`}
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
          {parentName && (
            <span className="text-mute">
              <CornerDownRight className="mr-1 inline size-3.5" aria-hidden="true" />
              {parentName} ·{" "}
            </span>
          )}
          <span className="text-mute">· {when}</span>
        </p>
        {editing ? (
          <div className="mt-1">
            <textarea
              value={draft}
              rows={2}
              maxLength={500}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Edit the chika text"
              className="min-h-14 w-full px-3 py-2 text-base font-normal"
            />
            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraft(c.body);
                  setEditing(false);
                }}
                className="min-h-9 rounded-sm border border-line px-3 text-xs font-bold transition-colors hover:border-brake"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || draft.trim().length === 0}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await updateComment(c.id, draft);
                    setEditing(false);
                    onEdited();
                    toast.success("Kept the new wording.");
                  } catch {
                    toast.error("Could not edit that.");
                  } finally {
                    setSaving(false);
                  }
                }}
                className="min-h-9 rounded-sm bg-herb px-3 text-xs font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                Keep
              </button>
            </div>
          </div>
        ) : (
          <>
            {c.body && <p className="mt-0.5 break-words text-sm">{c.body}</p>}
            {c.photo_url && (
              <img
                src={c.photo_url}
                alt={`Photo from ${c.cook_name ?? "a cook"}`}
                loading="lazy"
                className="mt-1.5 max-h-56 w-full max-w-xs rounded-sm object-cover"
              />
            )}
          </>
        )}
      </div>
      {!mine && userId && <ReportButton kind="comment" id={c.id} />}
      {editable && !editing && (
        <button
          type="button"
          aria-label="Edit this chika"
          title="Edit this chika"
          onClick={() => setEditing(true)}
          className="flex size-8 shrink-0 items-center justify-center rounded-sm text-mute transition-colors hover:text-herb"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </button>
      )}
      {userId && !mine && (
        <button
          type="button"
          aria-label={`Answer this chika`}
          onClick={() => onReply(c)}
          className="flex size-8 shrink-0 items-center justify-center rounded-sm text-mute transition-colors hover:text-herb"
          title="Answer this chika"
        >
          <CornerDownRight className="size-4" aria-hidden="true" />
        </button>
      )}
      {mine && (
        <button
          type="button"
          aria-label="Delete this chika"
          title="Delete this chika"
          onClick={async () => {
            try {
              await deleteComment(c.id);
              onDeleted();
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
}

export default function PostComments({ postId }: { postId: string }) {
  const session = useSession();
  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<CommentRow[] | null>(null);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentRow | null>(null);
  const [sending, setSending] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    void getSignedInUserId().then(setUserId);
  }, []);

  const refresh = useCallback(async () => {
    setRows(await loadComments(postId));
  }, [postId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const nameOf = (id: string | null) =>
    id ? (rows?.find((r) => r.id === id)?.cook_name ?? "a cook") : null;

  const tops = (rows ?? []).filter((r) => !r.parent_comment_id);
  const repliesOf = (id: string) => (rows ?? []).filter((r) => r.parent_comment_id === id);

  const send = async () => {
    if (!signedIn || sending) return;
    setSending(true);
    try {
      let photoUrl: string | undefined;
      if (photo) {
        photoUrl = await uploadPhoto(userId!, photo);
      }
      await addComment(postId, userId!, draft, replyingTo?.id ?? null, photoUrl);
      setDraft("");
      setReplyingTo(null);
      if (preview) URL.revokeObjectURL(preview);
      setPhoto(null);
      setPreview(null);
      void refresh();
      toast.success("Said it.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post that.");
    } finally {
      setSending(false);
    }
  };

  const pickPhoto = (file: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview(null);
    if (!file) return;
    const problem = photoProblem(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <section aria-label="Chika" className="mt-8">
      <h2 className="font-display text-xl font-semibold">
        Chika {rows ? `(${rows.length})` : ""}
      </h2>

      {rows !== null && tops.length > 0 && (
        <ul className="mt-3 space-y-2">
          {tops.map((c) => (
            <li key={c.id}>
              <ChikaCard
                c={c}
                userId={userId}
                onReply={(target) => setReplyingTo(target)}
                onEdited={() => void refresh()}
                onDeleted={() => void refresh()}
              />
              {repliesOf(c.id).length > 0 && (
                <ul className="mt-2 space-y-2">
                  {repliesOf(c.id).map((r) => (
                    <ChikaCard
                      key={r.id}
                      c={r}
                      userId={userId}
                      parentName={nameOf(r.parent_comment_id)}
                      onReply={(target) => setReplyingTo(target)}
                      onEdited={() => void refresh()}
                      onDeleted={() => void refresh()}
                      indent
                    />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {rows === null && (
        <p className="mt-3 text-sm text-mute">Gathering the chika...</p>
      )}

      {rows !== null && rows.length === 0 && (
        <p className="mt-3 text-sm text-mute">
          No chika yet. Be the first to say you are trying this.
        </p>
      )}

      {signedIn ? (
        <div className="mt-3 flex items-end gap-2">
          {replyingTo && (
            <div className="mt-4 flex w-full items-center gap-2 rounded-sm border border-line bg-paper-deep px-3 py-1.5 text-xs text-mute">
              Answering <span className="font-bold text-herb">{nameOf(replyingTo.id)}</span>
              <button
                type="button"
                aria-label="Stop replying"
                onClick={() => setReplyingTo(null)}
                className="ml-auto flex size-6 items-center justify-center rounded transition-colors hover:bg-card"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          {preview && (
            <img
              src={preview}
              alt="Photo you picked for this chika"
              className="size-12 shrink-0 self-start rounded-sm object-cover"
            />
          )}
          <label className="flex-1">
            <span className="sr-only">Write a reply</span>
            <textarea
              value={draft}
              rows={2}
              maxLength={500}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={replyingTo ? "Throw in your two centavos." : "Say something nice (or hungry)."}
              className="min-h-16 w-full px-3 py-2 text-base font-normal"
              aria-label="Write a reply"
            />
          </label>
          <label
            className="relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-line bg-card text-mute transition-colors hover:border-herb hover:text-herb"
            title="Attach a photo"
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              aria-label="Attach a photo"
              onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
            />
            <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 fill-current">
              <path d="M7 4.5c-.7 0-1.3.4-1.6 1l-.5 1H4a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-.9l-.5-1c-.3-.6-.9-1-1.6-1H7Zm3 8.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2Z" />
            </svg>
          </label>
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || (draft.trim().length === 0 && !photo)}
            className="min-h-11 rounded-sm bg-herb px-4 text-sm font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {replyingTo ? "Answer" : "Chika"}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-mute">
          <Link href="/login" className="font-bold text-herb hover:underline">
            Sign in
          </Link>{" "}
          to join the chika.
        </p>
      )}
    </section>
  );
}
