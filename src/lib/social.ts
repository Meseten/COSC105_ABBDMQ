"use client";

import { db } from "./db";
import { notify } from "./notifications";

export interface CookRow {
  id: string;
  display_name: string;
  xp: number;
  plan_count: number;
  streak_days: number;
  is_private: boolean;
}

/** True when the signed-in cook follows the given account. */
export async function isFollowing(
  followerId: string | null,
  followingId: string,
): Promise<boolean> {
  if (!followerId) return false;
  const sb = db();
  if (!sb) return false;
  const { data } = await sb
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Follows and unfollows a cook. Unfollows work signed-out only through
 * RLS, so the caller guards the signed-in case.
 */
export async function setFollowing(
  followerId: string,
  followingId: string,
  following: boolean,
): Promise<void> {
  const sb = db();
  if (!sb) throw new Error("Storage is not configured for this build.");
  if (following) {
    await sb
      .from("follows")
      .insert({ follower_id: followerId, following_id: followingId });
    void notify({ targetId: followingId, actorId: followerId, kind: "follow" });
  } else {
    await sb
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
  }
}

/** Everyone the given cook follows, with the followed cook's profile. */
export async function loadFollowing(cookId: string): Promise<CookRow[]> {
  const sb = db();
  if (!sb) return [];
  const { data } = await sb
    .from("follows")
    .select(
      "following_id, profiles!follows_following_id_fkey(id, display_name, xp, plan_count, streak_days, is_private)",
    )
    .eq("follower_id", cookId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Record<string, unknown>[];
  return rows
    .map((r) => r.profiles as unknown)
    .filter((p): p is CookRow => Boolean(p) && typeof p === "object" && "id" in (p as object))
    .map((p) => ({ ...p, xp: Number(p.xp) || 0, plan_count: Number(p.plan_count) || 0, streak_days: Number(p.streak_days) || 0 }));
}

/** Everyone whose board the given cook appears on (their followers). */
export async function loadFollowers(cookId: string): Promise<CookRow[]> {
  const sb = db();
  if (!sb) return [];
  const { data } = await sb
    .from("follows")
    .select(
      "follower_id, profiles!follows_follower_id_fkey(id, display_name, xp, plan_count, streak_days, is_private)",
    )
    .eq("following_id", cookId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Record<string, unknown>[];
  return rows
    .map((r) => r.profiles as unknown)
    .filter((p): p is CookRow => Boolean(p) && typeof p === "object" && "id" in (p as object))
    .map((p) => ({ ...p, xp: Number(p.xp) || 0, plan_count: Number(p.plan_count) || 0, streak_days: Number(p.streak_days) || 0 }));
}

/**
 * Counts of a cook's following and followers. Reads the join table directly
 * so the counts stay honest when profiles are slow or missing.
 */
export async function loadCrewCounts(
  cookId: string,
): Promise<{ following: number; followers: number }> {
  const sb = db();
  if (!sb) return { following: 0, followers: 0 };
  const [{ count: following }, { count: followers }] = await Promise.all([
    sb.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", cookId),
    sb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", cookId),
  ]);
  return { following: following ?? 0, followers: followers ?? 0 };
}

/**
 * Suggested cooks to follow: active profiles you do not follow yet,
 * most experienced first.
 */
export async function loadSuggestions(
  myId: string | null,
  limit = 12,
): Promise<CookRow[]> {
  const sb = db();
  if (!sb) return [];
  const base = sb
    .from("profiles")
    .select("id, display_name, xp, plan_count, streak_days, is_private")
    .gt("xp", 0)
    .order("xp", { ascending: false })
    .limit(limit + 20);
  const { data } = await base;
  if (!data) return [];
  let rows = data as CookRow[];
  if (myId) {
    rows = rows.filter((r) => r.id !== myId);
    if (rows.length) {
      const { data: mine } = await sb
        .from("follows")
        .select("following_id")
        .eq("follower_id", myId);
      const followedMine = new Set((mine ?? []).map((r) => String(r.following_id)));
      rows = rows.filter((r) => !followedMine.has(r.id));
    }
  }
  return rows.slice(0, limit);
}
