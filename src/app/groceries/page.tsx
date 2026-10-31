"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { CheckCircle2, Circle, Copy, ShoppingCart } from "lucide-react";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { loadPlans } from "@/lib/plans";
import { pesos, type SavedPlan } from "@/lib/types";

const CHECK_KEY = "pantrypal.grocery.v1";

function pickedMapFor(planId: string): string[] {
  try {
    const all = JSON.parse(window.localStorage.getItem(CHECK_KEY) ?? "{}");
    const val = all[planId];
    return Array.isArray(val) ? (val as string[]) : [];
  } catch {
    return [];
  }
}

function writePicked(planId: string, names: string[]): void {
  try {
    const all = JSON.parse(window.localStorage.getItem(CHECK_KEY) ?? "{}");
    all[planId] = names;
    window.localStorage.setItem(CHECK_KEY, JSON.stringify(all));
  } catch {
    // storage blocked; list still shows unchecked
  }
}

export default function GroceriesPage() {
  const [plans, setPlans] = useState<SavedPlan[] | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    void loadPlans().then((list) => {
      const withList = list.filter((p) => p.plan.shoppingList.length > 0);
      setPlans(withList);
      if (withList.length > 0) {
        setPlanId(withList[0].id);
        setPicked(pickedMapFor(withList[0].id));
      }
    });
  }, []);

  const plan = useMemo(() => plans?.find((p) => p.id === planId) ?? null, [plans, planId]);
  const items = plan?.plan.shoppingList ?? [];
  const pickedCount = items.filter((i) => picked.includes(i.itemName)).length;
  const total = items.reduce((acc, i) => acc + i.estimatedCost, 0);

  const toggle = (name: string) => {
    const next = picked.includes(name)
      ? picked.filter((n) => n !== name)
      : [...picked, name];
    setPicked(next);
    if (planId) writePicked(planId, next);
    if (next.length === items.length && items.length > 0) {
      toast.success("Basket complete. Magluto na!");
    }
  };

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-3xl px-5 sm:px-8">
        <section className="py-8">
          <h1 className="flex items-center gap-2 font-display text-3xl font-semibold">
            <ShoppingCart className="size-7 text-herb" aria-hidden="true" />
            Groceries
          </h1>
          <p className="mt-1 text-sm text-mute">
            One tick-off list per plan. Pick a plan, check items as they land in the
            basket; progress is remembered on this device.
          </p>
        </section>

        {plans === null ? (
          <p className="py-8 text-sm text-mute">
            <span className="simmer">Grabbing your lists...</span>
          </p>
        ) : plans.length === 0 ? (
          <div className="index-card max-w-xl p-6">
            <p className="font-display text-xl font-semibold">No shopping lists yet</p>
            <p className="mt-2 text-sm text-mute">
              A plan with missing ingredients generates a list of exactly what to buy.
              Draft one on the home page and it appears here.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-sm bg-brake px-5 py-3 text-sm font-bold text-on-brake transition-opacity hover:opacity-90"
            >
              Write a plan
            </Link>
          </div>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-sm font-bold">
              List for
              <select
                value={planId ?? ""}
                onChange={(e) => {
                  setPlanId(e.target.value);
                  setPicked(pickedMapFor(e.target.value));
                }}
                className="h-11 max-w-md px-3 text-base font-normal"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {p.pinned ? " (pinned)" : ""}
                  </option>
                ))}
              </select>
            </label>

            {plan && (
              <>
                <p className="mt-3 text-sm text-mute">
                  {pickedCount} of {items.length} picked · budget fit ~{pesos(total)} for
                  the week · drafted {plan.title.toLowerCase()}
                </p>
                <div
                  role="progressbar"
                  aria-valuenow={pickedCount}
                  aria-valuemin={0}
                  aria-valuemax={items.length}
                  aria-label="Basket progress"
                  className="mt-2 h-2 overflow-hidden rounded-full bg-paper-deep"
                >
                  <div
                    className="h-full rounded-full bg-herb transition-all duration-500"
                    style={{ width: `${items.length ? (pickedCount / items.length) * 100 : 0}%` }}
                  />
                </div>

                <ul className="index-card my-5 divide-y divide-line">
                  {items.map((item) => {
                    const done = picked.includes(item.itemName);
                    return (
                      <li key={item.itemName}>
                        <button
                          type="button"
                          aria-pressed={done}
                          onClick={() => toggle(item.itemName)}
                          className={`flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                            done ? "text-mute" : "hover:bg-paper-deep"
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="size-5 shrink-0 text-herb" aria-hidden="true" />
                          ) : (
                            <Circle className="size-5 shrink-0 text-mute" aria-hidden="true" />
                          )}
                          <span className={`flex-1 text-sm ${done ? "line-through" : "font-bold"}`}>
                            {item.itemName}
                          </span>
                          <span className="text-xs text-mute">{item.quantity}</span>
                          <span className="w-20 text-right text-sm font-bold text-sun-deep">
                            ~{pesos(item.estimatedCost)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="mb-10 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!planId) return;
                      const all = items.map((i) => i.itemName);
                      const next = all.every((n) => picked.includes(n)) ? [] : all;
                      setPicked(next);
                      writePicked(planId, next);
                    }}
                    className="min-h-11 rounded-sm border border-line bg-card px-4 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
                  >
                    {pickedCount === items.length && items.length > 0
                      ? "Clear the basket"
                      : "Mark everything picked"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const text = `PantryPal groceries for ${plan.title}\n\n${items
                        .map((i) => `[${picked.includes(i.itemName) ? "x" : " "}] ${i.itemName} (${i.quantity})`)
                        .join("\n")}`;
                      try {
                        await navigator.clipboard.writeText(text);
                        toast.success("List copied. Paste it anywhere.");
                      } catch {
                        toast.error("The browser blocked the copy.");
                      }
                    }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line bg-card px-4 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                    Copy the list
                  </button>
                  <Link
                    href="/saved"
                    className="inline-flex min-h-11 items-center rounded-sm border border-line bg-card px-4 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
                  >
                    Back to the kitchen
                  </Link>
                </div>
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
