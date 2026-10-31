export type MealSlot = "breakfast" | "lunch" | "dinner";

export const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

export interface PlannedMeal {
  name: string;
  description: string;
  usedAvailableIngredients: string[];
}

export interface PlanDay {
  day: number;
  meals: Record<MealSlot, PlannedMeal>;
}

export interface ShoppingItem {
  itemName: string;
  quantity: string;
  estimatedCost: number;
}

export interface FinancialSummary {
  totalEstimatedCost: number;
  currency: string;
  budgetStatus: string;
}

export interface PlanRequest {
  ingredients: string[];
  avoid: string[];
  servings: number;
  days: number;
  diet: string;
  cuisine: string;
  notes: string;
  budgetAmount: number | null;
}

export interface MealPlanResult {
  mealPlan: PlanDay[];
  shoppingList: ShoppingItem[];
  financialSummary: FinancialSummary;
  generatedAt: string;
  request: PlanRequest;
}

export interface SavedPlan {
  id: string;
  title: string;
  createdAt: string;
  /** Pinned plans sit at the top of the kitchen board. */
  pinned?: boolean;
  plan: MealPlanResult;
}

export interface PlanApiError {
  error: "not_configured" | "rate_limited" | "invalid" | "upstream" | "bad_request";
  message: string;
}

export function parsePlanResult(raw: unknown, request: PlanRequest): MealPlanResult {
  const o = raw as Record<string, unknown>;
  if (!o || typeof o !== "object") throw new Error("plan is not an object");

  const oneMeal = (v: unknown): PlannedMeal => {
    const m = (v ?? {}) as Record<string, unknown>;
    const used = Array.isArray(m.usedAvailableIngredients)
      ? (m.usedAvailableIngredients as unknown[])
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20)
      : [];
    return {
      name:
        typeof m.name === "string" && m.name.trim()
          ? m.name.trim().slice(0, 80)
          : "No meal planned",
      description: typeof m.description === "string" ? m.description.trim() : "",
      usedAvailableIngredients: used,
    };
  };

  const days: PlanDay[] = Array.isArray(o.mealPlan)
    ? (o.mealPlan as Record<string, unknown>[]).slice(0, 10).map((d, i) => {
        const mealsRaw = (d.meals ?? {}) as Record<string, unknown>;
        const meals = {} as Record<MealSlot, PlannedMeal>;
        for (const slot of MEAL_SLOTS) meals[slot] = oneMeal(mealsRaw[slot]);
        const dayNum =
          typeof d.day === "number" && Number.isFinite(d.day)
            ? Math.min(10, Math.max(1, Math.round(d.day)))
            : i + 1;
        return { day: dayNum, meals };
      })
    : [];
  if (days.length === 0) throw new Error("plan has no days");

  const shoppingList: ShoppingItem[] = Array.isArray(o.shoppingList)
    ? (o.shoppingList as Record<string, unknown>[])
        .filter((it) => typeof it?.itemName === "string" && it.itemName.trim())
        .slice(0, 40)
        .map((it) => ({
          itemName: String(it.itemName).trim().slice(0, 60),
          quantity: typeof it.quantity === "string" ? it.quantity.trim().slice(0, 40) : "",
          estimatedCost:
            typeof it.estimatedCost === "number" && Number.isFinite(it.estimatedCost)
              ? Math.max(0, it.estimatedCost)
              : 0,
        }))
    : [];

  const sum = shoppingList.reduce((acc, it) => acc + it.estimatedCost, 0);
  const fsRaw = (o.financialSummary ?? {}) as Record<string, unknown>;
  const financialSummary: FinancialSummary = {
    totalEstimatedCost:
      typeof fsRaw.totalEstimatedCost === "number" &&
      Number.isFinite(fsRaw.totalEstimatedCost)
        ? Math.max(0, fsRaw.totalEstimatedCost)
        : sum,
    currency: typeof fsRaw.currency === "string" ? fsRaw.currency.slice(0, 8) : "PHP",
    budgetStatus:
      typeof fsRaw.budgetStatus === "string" ? fsRaw.budgetStatus.slice(0, 60) : "",
  };

  return {
    mealPlan: days,
    shoppingList,
    financialSummary,
    generatedAt: new Date().toISOString(),
    request,
  };
}

/** Derives a short shelf title from the request the plan answered. */
export function planTitle(request: PlanRequest): string {
  const n = request.days;
  const span = n === 1 ? "one day" : n === 7 ? "one week" : `${n} days`;
  const feed = request.servings === 1 ? "for one" : `for ${request.servings}`;
  return `Plan: ${span}, ${feed}`;
}

/** Formats a peso amount without decimals when it is a whole number. */
export function pesos(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}
