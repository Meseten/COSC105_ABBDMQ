"use client";

import { db } from "./db";
import { notify } from "./notifications";
import type { PublicPlan } from "./community";
import type { MealPlanResult } from "./types";

/** Bookmark another cook's board so it lands in your "want to try" shelf. */
export async function saveBoard(post: PublicPlan, userId: string): Promise<void> {
  const sb = db();
  if (!sb) throw new Error("Storage not configured.");
  const { error } = await sb.from("board_saves").insert({ user_id: userId, post_id: post.id });
  if (error && error.code !== "23505") throw new Error(error.message); // already saved is fine
  void notify({ targetId: post.user_id, actorId: userId, kind: "save", postId: post.id });
}

export async function unsaveBoard(postId: string, userId: string): Promise<void> {
  const sb = db();
  if (!sb) throw new Error("Storage not configured.");
  const { error } = await sb
    .from("board_saves")
    .delete()
    .eq("user_id", userId)
    .eq("post_id", postId);
  if (error) throw new Error(error.message);
}

/** Which of these posts are on my shelf. */
export async function savedPostIds(postIds: string[], userId: string | null): Promise<Set<string>> {
  if (!userId || postIds.length === 0) return new Set();
  const sb = db();
  if (!sb) return new Set();
  const { data } = await sb
    .from("board_saves")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);
  return new Set((data ?? []).map((r) => String(r.post_id)));
}

/** Full shelf: saved posts of other cooks, newest first. */
export async function loadSavedBoards(userId: string): Promise<PublicPlan[]> {
  const sb = db();
  if (!sb) return [];
  const { data, error } = await sb
    .from("board_saves")
    .select("post_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data || data.length === 0) return [];
  const ids = data.map((r) => String(r.post_id));
  const { data: posts } = await sb
    .from("shared_plans")
    .select("id, user_id, title, plan, like_count, created_at, visibility")
    .in("id", ids)
    .in("visibility", ["public", "buddies"]);
  if (!posts) return [];
  const order = new Map(ids.map((id, i) => [id, i]));
  const { loadFollowing } = await import("./social");
  const following = new Set((await loadFollowing(userId)).map((c) => c.id));
  // Keep only posts the shelf owner can actually root for: public and crew.
  const out = posts
    .filter((p) => p.visibility === "public" || following.has(String(p.user_id)))
    .sort((a, b) => (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0));
  const cookerNames = await (async () => {
    const ownerIds = [...new Set(out.map((p) => String(p.user_id)))];
    if (ownerIds.length === 0) return new Map<string, string>();
    const { data: cooks } = await sb
      .from("profiles")
      .select("id, display_name")
      .in("id", ownerIds);
    return new Map((cooks ?? []).map((c) => [String(c.id), String(c.display_name ?? "")]));
  })();
  return out.map((p) => ({
    id: String(p.id),
    user_id: String(p.user_id),
    title: String(p.title),
    plan: p.plan as MealPlanResult,
    like_count: Number(p.like_count ?? 0),
    created_at: String(p.created_at),
    visibility: p.visibility === "buddies" ? ("buddies" as const) : ("public" as const),
    liked: false,
    cook_name: cookerNames.get(String(p.user_id)) ?? null,
  }));
}
