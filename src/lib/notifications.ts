"use client";

import { db } from "./db";

export type NotificationKind = "follow" | "like" | "comment" | "save";

export type NotificationRow = {
  id: string;
  kind: NotificationKind;
  is_read: boolean;
  created_at: string;
  actor_id: string;
  actor_name: string | null;
  post_id: string | null;
  post_title: string | null;
};

/** Tell someone something happened. The cook is never notified of their own moves. */
export async function notify(opts: {
  targetId: string;
  actorId: string;
  kind: NotificationKind;
  postId?: string | null;
}): Promise<void> {
  if (!opts.targetId || opts.actorId === opts.targetId) return;
  const sb = db();
  if (!sb) return;
  await sb
    .from("notifications")
    .insert({
      user_id: opts.targetId,
      actor_id: opts.actorId,
      kind: opts.kind,
      post_id: opts.postId ?? null,
    })
    .then(() => undefined);
}

/** Bell badge: how many pings are still unread. */
export async function unreadCount(userId: string | null): Promise<number> {
  if (!userId) return 0;
  const sb = db();
  if (!sb) return 0;
  const { count } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

/** Latest pings with cook names and post titles attached. */
export async function loadInbox(userId: string, limit = 20): Promise<NotificationRow[]> {
  const sb = db();
  if (!sb) return [];
  const { data } = await sb
    .from("notifications")
    .select(
      "id, kind, is_read, created_at, actor_id, post_id, actors(display_name), posts(title)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!data) return [];
  return data.map((r) => {
    const row = r as unknown as {
      actors: { display_name: string | null } | { display_name: string | null }[] | null;
      posts: { title: string | null } | { title: string | null }[] | null;
    };
    const a = Array.isArray(row.actors) ? row.actors[0] : row.actors;
    const p = Array.isArray(row.posts) ? row.posts[0] : row.posts;
    return {
      id: String(r.id),
      kind: String(r.kind) as NotificationKind,
      is_read: Boolean(r.is_read),
      created_at: String(r.created_at),
      actor_id: String(r.actor_id),
      actor_name: a?.display_name ?? null,
      post_id: r.post_id ? String(r.post_id) : null,
      post_title: p?.title ?? null,
    };
  });
}

/** Clear the badge after reading. */
export async function markAllRead(userId: string): Promise<void> {
  const sb = db();
  if (!sb) return;
  await sb.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
}
