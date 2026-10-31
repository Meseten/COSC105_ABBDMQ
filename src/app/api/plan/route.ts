import { NextResponse, type NextRequest } from "next/server";
import { generatePlan } from "@/lib/gemini";
import type { PlanRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type PlanBody = {
  ingredients?: unknown;
  avoid?: unknown;
  servings?: unknown;
  days?: unknown;
  budgetAmount?: unknown;
  diet?: unknown;
  cuisine?: unknown;
  notes?: unknown;
};

function toStringArray(v: unknown, maxItems: number, maxLen: number): string[] {
  const list = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
  return list
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, maxItems)
    .map((s) => s.slice(0, maxLen));
}

function toInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function invalid(message: string) {
  return NextResponse.json({ error: "bad_request", message }, { status: 400 });
}

// Small in-memory cooldown so a demo click-storm cannot burn the API key.
const lastHitByIp = new Map<string, number>();
const COOLDOWN_MS = 5_000;

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error: "not_configured",
        message:
          "The server has no Gemini API key yet. Add GEMINI_API_KEY to .env.local and restart the app.",
      },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const last = lastHitByIp.get(ip) ?? 0;
  if (now - last < COOLDOWN_MS) {
    return NextResponse.json(
      { error: "rate_limited", message: "One plan at a time. Give it a few seconds." },
      { status: 429 },
    );
  }
  lastHitByIp.set(ip, now);

  const body = (await request.json().catch(() => null)) as PlanBody | null;
  if (!body) return invalid("Send a JSON body.");

  const ingredients = toStringArray(body.ingredients, 60, 40);
  if (ingredients.length < 1) {
    return invalid("Tell me at least one pantry ingredient you already have.");
  }
  const avoid = toStringArray(body.avoid, 30, 40);
  const diet = typeof body.diet === "string" ? body.diet.trim().slice(0, 40) : "";
  const cuisine =
    typeof body.cuisine === "string" ? body.cuisine.trim().slice(0, 40) : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";
  const servings = toInt(body.servings, 1, 12, 2);
  const days = toInt(body.days, 1, 7, 3);
  const budgetRaw =
    typeof body.budgetAmount === "string" ? parseFloat(body.budgetAmount) : body.budgetAmount;
  const budgetAmount =
    typeof budgetRaw === "number" && Number.isFinite(budgetRaw) && budgetRaw > 0
      ? Math.min(100000, Math.round(budgetRaw))
      : null;

  const planRequest: PlanRequest = {
    ingredients,
    avoid,
    servings,
    days,
    diet,
    cuisine,
    notes,
    budgetAmount,
  };

  try {
    const plan = await generatePlan(planRequest);
    return NextResponse.json({ plan });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error while planning.";
    return NextResponse.json(
      { error: "upstream", message: `Could not finish the plan. ${message}` },
      { status: 502 },
    );
  }
}
