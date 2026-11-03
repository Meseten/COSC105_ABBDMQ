"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Bookmark, Heart, MessageCircle, UserRoundPlus } from "lucide-react";
import { db } from "@/lib/db";
import {
  loadInbox,
  markAllRead,
  unreadCount,
  type NotificationRow,
} from "@/lib/notifications";
import { getSignedInUserId } from "@/lib/plans";

const KIND_COPY: Record<NotificationRow["kind"], string> = {
  follow: "followed you",
  like: "tasted your board",
  comment: "left a chika on your board",
  save: "saved your board",
};

export default function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationRow[] | null>(null);

  useEffect(() => {
    void getSignedInUserId().then((uid) => uid && setUserId(uid));
  }, []);

  const refresh = useCallback(async () => {
    const sb = db();
    if (!userId || !sb) return;
    setUnread(await unreadCount(userId));
    setItems(await loadInbox(userId));
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <details
      className="group relative"
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open) void refresh();
      }}
    >
      <summary
        className="relative flex min-h-11 cursor-pointer list-none items-center justify-center rounded-sm border border-line px-2.5 transition-colors hover:border-herb hover:text-herb [&::-webkit-details-marker]:hidden"
        aria-label="Notifications"
      >
        <Bell className="size-4 text-mute transition-colors group-hover:text-herb" aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-brake px-1 text-[10px] font-bold leading-4 text-on-brake"
            aria-label={`${unread} unread notifications`}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </summary>
      <div
        className="animate-pop absolute right-0 z-50 mt-2 w-80 rounded border border-line bg-card p-2 shadow-lg"
        role="menu"
      >
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="font-display text-sm font-semibold">Your bell</span>
          {items !== null && items.length > 0 && userId && (
            <button
              type="button"
              onClick={() => {
                void markAllRead(userId).then(() => {
                  setUnread(0);
                  setItems(
                    (prev) => prev?.map((n) => ({ ...n, is_read: true })) ?? null,
                  );
                });
              }}
              className="text-xs font-bold text-mute transition-colors hover:text-herb"
            >
              Mark all read
            </button>
          )}
        </div>
        {items === null ? (
          <p className="px-1 py-3 text-sm text-mute">Listening for new pings...</p>
        ) : items.length === 0 ? (
          <p className="px-1 py-3 text-sm text-mute">
            Quiet so far. Post a board, then watch your bell.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.post_id ? `/community/${n.post_id}` : `/cooks/${n.actor_id}`}
                  className="flex items-start gap-2 rounded px-2 py-2 text-sm transition-colors hover:bg-paper-deep"
                  onClick={(e) => e.currentTarget.closest("details")?.removeAttribute("open")}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 shrink-0 ${n.is_read ? "text-mute" : "text-sun-deep"}`}
                  >
                    {n.kind === "follow" && <UserRoundPlus className="size-4" />}
                    {n.kind === "like" && <Heart className="size-4" />}
                    {n.kind === "comment" && <MessageCircle className="size-4" />}
                    {n.kind === "save" && <Bookmark className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={n.is_read ? "text-mute" : "font-bold"}>
                      {n.actor_name ?? "A cook"} {KIND_COPY[n.kind]}
                    </span>
                    {n.post_title && (
                      <span className="block truncate text-xs text-mute">{n.post_title}</span>
                    )}
                    <span className="block text-[11px] text-mute">
                      {new Intl.DateTimeFormat("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(n.created_at))}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
