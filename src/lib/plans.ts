"use client";

import { db } from "./db";
import { grantPlanXp } from "./community";
import { planTitle, type MealPlanResult, type SavedPlan } from "./types";

const LOCAL_KEY = "pantrypal.plans.v2";

/** One kitchen-to-planner handoff: a recipe pours its ingredients in. */
export const PANTRY_HANDOFF_KEY = "pantrypal.pantry.handoff.v1";

/** Stashes an ingredient list for the home planner to pick up on next view. */
export function stashPantryHandoff(ingredients: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PANTRY_HANDOFF_KEY, JSON.stringify(ingredients));
  } catch {
    // storage blocked; the button just won't refill the planner
  }
}

/** Takes the stashed pantry once; returns null when there is no handoff. */
export function pullPantryHandoff(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PANTRY_HANDOFF_KEY);
    if (raw === null) return null;
    window.localStorage.removeItem(PANTRY_HANDOFF_KEY);
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 60)
      : null;
  } catch {
    try {
      window.localStorage.removeItem(PANTRY_HANDOFF_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

function readLocal(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedPlan[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(plans: SavedPlan[]): void {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(plans));
  } catch {
    // Storage full or blocked; the in-memory copy still works this visit.
  }
}

/** Device copy, newest first. Works even with no account or offline. */
export function getLocalPlans(): SavedPlan[] {
  return readLocal().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSignedInUserId(): Promise<string | null> {
  const sb = db();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  if (!data?.user || data.user.is_anonymous) return null;
  return data.user.id;
}

interface RemotePlanRow {
  id: string;
  title: string;
  created_at?: string;
  pinned?: boolean;
  data?: { generatedAt?: string };
}

/** Signed-in kitchen: pinned plans float to the top, then newest first. */
export async function loadPlans(): Promise<SavedPlan[]> {
  const userId = await getSignedInUserId();
  const sb = userId ? db() : null;
  if (!userId || !sb) return getLocalPlans();

  const { data, error } = await sb
    .from("meal_plans")
    .select("id, title, created_at, data, pinned")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !Array.isArray(data)) return getLocalPlans();

  const remote = (data as RemotePlanRow[]).map((r) => ({
    id: String(r.id),
    title: String(r.title ?? "Plan"),
    createdAt: String(r.created_at ?? r.data?.generatedAt ?? ""),
    pinned: Boolean((r as { pinned?: boolean }).pinned),
    plan: r.data as MealPlanResult,
  }));
  if (remote.length === 0) return getLocalPlans();

  const local = getLocalPlans();
  const remoteIds = new Set(remote.map((r) => r.id));
  return sortPinnedFirst([...remote, ...local.filter((p) => !remoteIds.has(p.id))]);
}

function sortPinnedFirst(plans: SavedPlan[]): SavedPlan[] {
  return plans.sort((a, b) => {
    const pinDiff = Number(b.pinned ?? false) - Number(a.pinned ?? false);
    if (pinDiff !== 0) return pinDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Saves to the device always, and to the account when one is signed in. */
export async function savePlan(plan: MealPlanResult): Promise<SavedPlan> {
  const saved: SavedPlan = {
    id: crypto.randomUUID(),
    title: planTitle(plan.request),
    createdAt: plan.generatedAt,
    plan,
  };
  writeLocal([saved, ...readLocal()]);

  const userId = await getSignedInUserId();
  const sb = userId ? db() : null;
  if (userId && sb) {
    try {
      await sb.from("meal_plans").insert({
        id: saved.id,
        user_id: userId,
        title: saved.title,
        data: {
          ...plan,
          request: plan.request, // kept whole so the shelf can replay the settings
        },
      });
    } catch {
      // Mirror failed; the plan is still safely on this device.
    }
    void grantPlanXp(); // counted on the server, once per day
  }
  return saved;
}

export async function deletePlan(id: string): Promise<void> {
  writeLocal(readLocal().filter((p) => p.id !== id));
  const userId = await getSignedInUserId();
  const sb = userId ? db() : null;
  if (userId && sb) {
    try {
      await sb.from("meal_plans").delete().eq("id", id).eq("user_id", userId);
    } catch {
      // best effort
    }
  }
}

/** Pins (or unpins) a plan; pinned plans lead the kitchen board. */
export async function setPinned(id: string, pinned: boolean): Promise<void> {
  writeLocal(
    readLocal().map((p) => (p.id === id ? { ...p, pinned } : p)),
  );
  const userId = await getSignedInUserId();
  const sb = userId ? db() : null;
  if (userId && sb) {
    try {
      await sb.from("meal_plans").update({ pinned }).eq("id", id).eq("user_id", userId);
    } catch {
      // best effort; local copy already pinned
    }
  }
}

/** Renders a plan as a plain grocery-note text file for download/sharing. */
export function planToText(saved: SavedPlan): string {
  const { plan, title } = saved;
  const lines: string[] = [title, "".padEnd(Math.max(title.length, 20), "-"), ""];
  plan.mealPlan.forEach((day) => {
    lines.push(`Day ${day.day}`);
    const slots: Array<[string, { name: string; description: string }]> = [
      ["Breakfast", day.meals.breakfast],
      ["Lunch", day.meals.lunch],
      ["Dinner", day.meals.dinner],
    ];
    for (const [slot, meal] of slots) {
      lines.push(`  ${slot}: ${meal.name}`);
      if (meal.description) lines.push(`          ${meal.description}`);
    }
    lines.push("");
  });
  if (plan.shoppingList.length) {
    lines.push("Shopping list");
    for (const item of plan.shoppingList) {
      lines.push(`  [ ] ${item.itemName} (${item.quantity}) — ~${item.estimatedCost}`);
    }
    lines.push("");
  }
  const fin = plan.financialSummary;
  lines.push(
    `Estimated shopping total: ${fin.totalEstimatedCost} ${fin.currency} · ${fin.budgetStatus}`,
  );
  return lines.join("\n");
}
