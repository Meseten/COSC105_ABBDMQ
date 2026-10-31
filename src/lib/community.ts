"use client";

import { db } from "./db";
import type { MealPlanResult } from "./types";

export interface PublicPlan {
  id: string;
  created_at: string;
  title: string;
  plan: MealPlanResult;
  like_count: number;
  user_id: string;
  cook_name: string | null;
  liked: boolean;
}

const PAGE_SIZE = 24;

/**
 * Fetches the public recipe board with my likes marked.
 * sort "new" → newest first; sort "loved" → most-liked first.
 */
export async function loadPublicPlans(
  userId: string | null,
  page = 0,
  sort: "new" | "loved" = "new",
): Promise<PublicPlan[]> {
  const sb = db();
  if (!sb) return [];

  const from = page * PAGE_SIZE;
  const { data, error } = await sb
    .from("shared_plans")
    .select("id, created_at, title, plan, like_count, user_id")
    .order(sort === "loved" ? "like_count" : "created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error || !data) return [];

  const rows = data as Record<string, unknown>[];
  const planIds = rows.map((r) => String(r.id));

  let liked = new Set<string>();
  if (userId && planIds.length) {
    const { data: likes } = await sb
      .from("plan_likes")
      .select("plan_id")
      .eq("user_id", userId)
      .in("plan_id", planIds);
    liked = new Set((likes ?? []).map((l) => String(l.plan_id)));
  }

  const unsorted = rows.map((r) => ({
    id: String(r.id),
    created_at: String(r.created_at ?? ""),
    title: String(r.title ?? "A week of meals"),
    plan: r.plan as MealPlanResult,
    like_count: typeof r.like_count === "number" ? r.like_count : 0,
    user_id: String(r.user_id ?? ""),
    cook_name:
      typeof r.cook_name === "string" && r.cook_name ? r.cook_name : null,
    liked: liked.has(String(r.id)),
  }));
  return sort === "loved"
    ? unsorted.sort(
        (a, b) => b.like_count - a.like_count || b.created_at.localeCompare(a.created_at),
      )
    : unsorted;
}

export async function loadOnePublicPlan(
  id: string,
  userId: string | null,
): Promise<PublicPlan | null> {
  const sb = db();
  if (!sb) return null;
  const { data, error } = await sb
    .from("shared_plans")
    .select("id, created_at, title, plan, like_count, user_id")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  let liked = false;
  if (userId) {
    const { data: mine } = await sb
      .from("plan_likes")
      .select("plan_id")
      .eq("user_id", userId)
      .eq("plan_id", id)
      .maybeSingle();
    liked = Boolean(mine);
  }
  return {
    id: String(row.id),
    created_at: String(row.created_at ?? ""),
    title: String(row.title ?? "A week of meals"),
    plan: row.plan as MealPlanResult,
    like_count: typeof row.like_count === "number" ? row.like_count : 0,
    user_id: String(row.user_id ?? ""),
    cook_name: null,
    liked,
  };
}

export async function toggleLike(
  planId: string,
  userId: string,
  liked: boolean,
): Promise<void> {
  const sb = db();
  if (!sb) return;
  if (liked) {
    await sb.from("plan_likes").delete().eq("plan_id", planId).eq("user_id", userId);
  } else {
    await sb.from("plan_likes").insert({ plan_id: planId, user_id: userId });
  }
}

export async function deleteSharedPlan(planId: string, userId: string): Promise<void> {
  const sb = db();
  if (!sb) return;
  await sb.from("shared_plans").delete().eq("id", planId).eq("user_id", userId);
}

export async function sharePlan(plan: MealPlanResult, title: string): Promise<string> {
  const sb = db();
  if (!sb) throw new Error("Sign in first to post recipes.");
  const { data, error } = await sb.rpc("share_plan", {
    p_title: title,
    p_plan: plan as unknown as Record<string, unknown>,
  });
  if (error) throw new Error(error.message);
  return String(data);
}

export interface ChatMessageRow {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
}

export async function loadChatHistory(): Promise<ChatMessageRow[]> {
  const sb = db();
  if (!sb) return [];
  const { data, error } = await sb
    .from("chat_messages")
    .select("id, user_id, content, created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error || !data) return [];
  return (data as ChatMessageRow[]).reverse();
}

export async function sendChatMessage(
  content: string,
  userId: string,
): Promise<ChatMessageRow | null> {
  const sb = db();
  if (!sb) return null;
  const { data, error } = await sb
    .from("chat_messages")
    .insert({ content, user_id: userId })
    .select("id, user_id, content, created_at")
    .single();
  if (error || !data) return null;
  return data as ChatMessageRow;
}

/** Requests the plan-level xp bump and returns the refreshed profile row. */
export async function grantPlanXp(): Promise<Record<string, unknown> | null> {
  const sb = db();
  if (!sb || !(await sb.auth.getUser()).data?.user) return null;
  const { data, error } = await sb.rpc("grant_plan_xp");
  if (error || !data) return null;
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  return row ?? null;
}
