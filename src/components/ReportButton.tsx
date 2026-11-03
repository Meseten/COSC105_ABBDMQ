"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Flag } from "lucide-react";
import { addReport } from "@/lib/reports";
import { getSignedInUserId } from "@/lib/plans";

export default function ReportButton({
  kind,
  id,
}: {
  kind: "post" | "comment";
  id: string;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void getSignedInUserId().then(setUserId);
  }, []);

  const send = async () => {
    if (!userId || sending) return;
    setSending(true);
    try {
      await addReport({
        reporterId: userId,
        postId: kind === "post" ? id : null,
        commentId: kind === "comment" ? id : null,
        reason,
      });
      setOpen(false);
      setReason("");
      toast.success("Sent. The stewards will take a look.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send that.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={`Report this ${kind}`}
        title={`Report this ${kind}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!userId) {
            toast.error("Sign in to report something.");
            return;
          }
          setOpen(true);
        }}
        className="flex size-8 shrink-0 items-center justify-center rounded-sm text-mute transition-colors hover:text-brake"
      >
        <Flag className="size-3.5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Report this ${kind}`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-5"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded border border-line bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold">
              Report this {kind}
            </h3>
            <p className="mt-1 text-xs text-mute">
              Broken, mean, or copied wrong. Tell the stewards in one short line.
            </p>
            <textarea
              autoFocus
              value={reason}
              rows={3}
              maxLength={300}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What is wrong here?"
              aria-label="Report reason"
              className="mt-3 min-h-20 w-full px-3 py-2 text-base font-normal"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-10 rounded-sm border border-line px-4 text-sm font-bold transition-colors hover:border-brake"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void send()}
                disabled={sending || reason.trim().length === 0}
                className="min-h-10 rounded-sm bg-brake px-4 text-sm font-bold text-on-brake transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                Send report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
