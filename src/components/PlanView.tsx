"use client";

import { useRef, useState } from "react";
import { MEAL_SLOTS, pesos, type MealPlanResult } from "@/lib/types";

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("under")) return "text-herb";
  if (s.includes("over")) return "text-brake";
  return "text-sun-deep";
}

export default function PlanView({ plan }: { plan: MealPlanResult }) {
  const [openDay, setOpenDay] = useState(0);
  const [bought, setBought] = useState<Set<number>>(new Set());
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const toggleBought = (index: number) => {
    setBought((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const onTabKeys = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = (index + delta + plan.mealPlan.length) % plan.mealPlan.length;
      setOpenDay(next);
      tabRefs.current[next]?.focus();
    }
  };

  const line = [
    `${plan.request.servings} ${plan.request.servings === 1 ? "person" : "people"}`,
    `${plan.mealPlan.length} ${plan.mealPlan.length === 1 ? "day" : "days"}`,
    "Breakfast · Lunch · Dinner",
  ];
  if (plan.request.diet) line.push(plan.request.diet);
  if (plan.request.cuisine) line.push(`${plan.request.cuisine} dishes`);

  const remaining = plan.shoppingList.reduce(
    (acc, item, i) => (bought.has(i) ? acc : acc + item.estimatedCost),
    0,
  );

  const copyList = async () => {
    const text = plan.shoppingList
      .map((it) => `- ${it.itemName}${it.quantity ? ` (${it.quantity})` : ""}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(`Shopping list\n${text}`);
    } catch {
      // Clipboard blocked; the list stays visible below.
    }
  };

  return (
    <article className="index-card p-5 pt-8 sm:p-7 sm:pt-10" aria-label="Your meal plan">
      <h3 className="font-display text-3xl font-semibold text-herb sm:text-4xl">
        Your {plan.mealPlan.length === 1 ? "day" : `${plan.mealPlan.length}-day`} plan
      </h3>
      <p className="mt-1 text-sm text-mute">
        {line.join(" · ")} · {fmtDate(plan.generatedAt)}
      </p>

      <div
        role="tablist"
        aria-label="Days"
        className="mt-8 flex gap-2 overflow-x-auto pb-3"
      >
        {plan.mealPlan.map((day, i) => (
          <button
            key={i}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`day-tab-${i}`}
            aria-selected={openDay === i}
            aria-controls={`day-panel-${i}`}
            tabIndex={openDay === i ? 0 : -1}
            onClick={() => setOpenDay(i)}
            onKeyDown={(e) => onTabKeys(e, i)}
            className={`-mb-px min-h-11 shrink-0 rounded-t-md border border-b-0 px-4 py-2.5 font-display text-base font-semibold transition-colors ${
              openDay === i
                ? "border-line bg-card text-herb"
                : "border-transparent bg-paper-deep text-mute hover:text-ink"
            }`}
          >
            Day {day.day}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`day-panel-${openDay}`}
        aria-labelledby={`day-tab-${openDay}`}
        className="rounded-b-md border border-line bg-card p-4 sm:p-5"
      >
        <ul className="flex flex-col gap-5">
          {MEAL_SLOTS.map((slot) => {
            const meal = plan.mealPlan[openDay]?.meals?.[slot];
            if (!meal) return null;
            return (
              <li key={slot} className="border-b border-line pb-5 last:border-0 last:pb-0">
                <p className="text-sm font-bold text-sun-deep first-letter:uppercase">{slot}</p>
                <h4 className="mt-1 font-display text-xl font-semibold">{meal.name}</h4>
                {meal.description && (
                  <p className="mt-1 text-base text-mute">{meal.description}</p>
                )}
                {meal.usedAvailableIngredients.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {meal.usedAvailableIngredients.map((ing) => (
                      <span
                        key={ing}
                        className="rounded bg-paper-deep px-2 py-0.5 text-xs font-bold"
                      >
                        {ing}
                      </span>
                    ))}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <h3 className="font-display text-2xl font-semibold">Shopping list</h3>
          <p className="text-sm text-mute" aria-live="polite">
            {bought.size}/{plan.shoppingList.length} items crossed off
          </p>
        </div>
        <p className="mt-1 text-sm text-mute">
          Estimated market prices, not a quotation. Cross items off as they land in the basket.
        </p>
        <ul className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          {plan.shoppingList.map((item, i) => (
            <li key={i}>
              <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded px-1 text-base transition-colors hover:bg-paper-deep">
                <input
                  type="checkbox"
                  checked={bought.has(i)}
                  onChange={() => toggleBought(i)}
                  className="size-4 accent-[color:var(--herb)]"
                />
                <span className={bought.has(i) ? "text-mute line-through" : ""}>
                  <span className="font-bold">{item.itemName}</span>
                  {item.quantity && <span className="text-mute"> · {item.quantity}</span>}
                </span>
                <span className="ml-auto text-sm text-mute">{item.estimatedCost > 0 ? pesos(item.estimatedCost) : "—"}</span>
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => void copyList()}
          className="mt-4 min-h-10 rounded-sm border border-line bg-card px-4 py-2 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
        >
          Copy list to clipboard
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2 rounded-sm bg-paper-deep px-4 py-3">
        <div>
          <p className="text-sm text-mute">Estimated total</p>
          <p className="font-display text-2xl font-semibold">
            {pesos(plan.financialSummary.totalEstimatedCost)}
          </p>
        </div>
        <p className={`text-sm font-bold ${statusTone(plan.financialSummary.budgetStatus)}`}>
          {plan.financialSummary.budgetStatus || "Estimate ready"}
        </p>
      </div>
      <p className="mt-2 text-xs text-mute">
        {plan.request.budgetAmount !== null
          ? `Your budget: ${pesos(plan.request.budgetAmount)} · about ${pesos(Math.max(0, plan.request.budgetAmount - remaining))} left after buying everything listed`
          : "No budget set, so this is a plain estimate."}
      </p>
    </article>
  );
}
