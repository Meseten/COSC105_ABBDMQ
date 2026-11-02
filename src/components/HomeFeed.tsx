"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadPublicPlans, type PublicPlan } from "@/lib/community";
import { getSignedInUserId } from "@/lib/plans";
import { pesos } from "@/lib/types";
import { Flame } from "lucide-react";

/**
 * The little feed under the hero: three latest boards from the community,
 * for signed-in cooks only, so home feels alive without a full feed page.
 */
export default function HomeFeed() {
  const [list, setList] = useState<PublicPlan[] | null>(null);

  useEffect(() => {
    let alive = true;
    void getSignedInUserId().then((uid) => {
      if (!alive || !uid) return;
      void loadPublicPlans(uid).then((r) => {
        if (alive) setList(r.slice(0, 3));
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  if (list === null || list.length === 0) return null;

  return (
    <section className="mb-10 max-w-2xl" aria-label="Fresh from the community board">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
        <Flame className="size-5 text-sun" aria-hidden="true" />
        Fresh off the board
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {list.map((plan) => (
          <li key={plan.id}>
            <Link
              href={`/community/${plan.id}`}
              className="index-card block p-4 transition-colors hover:border-herb"
            >
              <p className="truncate text-[11px] font-bold text-mute">
                {plan.cook_name ?? "A cook here"}
              </p>
              <p className="mt-1 truncate font-display text-base font-semibold">{plan.title}</p>
              <p className="mt-1 text-xs text-mute">
                {plan.plan.mealPlan.length} {plan.plan.mealPlan.length === 1 ? "day" : "days"} ·
                ~{pesos(plan.plan.financialSummary.totalEstimatedCost)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
