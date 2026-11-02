"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Carrot, ChefHat, Clock3, Copy, Heart, MessageCircle, Trash2 } from "lucide-react";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { PanMascot } from "@/components/ChefDock";
import { db } from "@/lib/db";
import { useSession } from "@/lib/auth";
import { stashPantryHandoff } from "@/lib/plans";

interface Recipe {
  id: string;
  title: string;
  minutes: number;
  category: string;
  ingredients: string[];
  steps: string;
  favorite: boolean;
  created_at: string;
}

const COOK_KEY = "pantrypal.cook.v1";

function doneStepsFor(recipeId: string): number[] {
  try {
    const all = JSON.parse(window.localStorage.getItem(COOK_KEY) ?? "{}");
    const val = all[recipeId];
    return Array.isArray(val) ? (val as number[]) : [];
  } catch {
    return [];
  }
}

function writeDoneSteps(recipeId: string, steps: number[]): void {
  try {
    const all = JSON.parse(window.localStorage.getItem(COOK_KEY) ?? "{}");
    all[recipeId] = steps;
    window.localStorage.setItem(COOK_KEY, JSON.stringify(all));
  } catch {
    // storage blocked; cook mode still works this visit
  }
}

/** User recipes store steps as freeform text; cook mode treats
 * each line or numbered item as one check-off step. Numbering a
 * paragraph dumps is the author's job, bullets are already there. */
function parseSteps(steps: string): string[] {
  return steps
    .split(/\n+/)
    .map((line) => line.trim().replace(/^\d+[.)]\s*/, ""))
    .filter(Boolean)
    .slice(0, 15);
}

export default function RecipeDetailPage() {
  const session = useSession();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null | "missing">(null);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    if (session === undefined) return;
    if (!session || session.user.is_anonymous) {
      setRecipe("missing");
      return;
    }
    let alive = true;
    void (async () => {
      const sb = db();
      if (!sb || !params?.id) {
        if (alive) setRecipe("missing");
        return;
      }
      const { data, error } = await sb
        .from("personal_recipes")
        .select("id, title, minutes, category, ingredients, steps, favorite, created_at")
        .eq("id", String(params.id))
        .eq("user_id", session.user.id)
        .limit(1);
      if (!alive) return;
      if (error && error.code === "42501") {
        toast.error("That recipe belongs to another cook.");
        setRecipe("missing");
        return;
      }
      const row = (data ?? [])[0] as Recipe | undefined;
      if (row) {
        setRecipe(row);
        setDone(doneStepsFor(row.id));
      } else {
        setRecipe("missing");
      }
    })();
    return () => {
      alive = false;
    };
  }, [session, params]);

  const built = recipe !== "missing" && recipe !== null ? parseSteps(recipe.steps) : [];
  const doneCount = done.filter((n) => n < built.length && built[n]).length;
  const finishProgress = Math.round((doneCount / built.length) * 100);

  const toggleStep = (index: number) => {
    if (!recipe || recipe === "missing" || !built[index]) return;
    const next = done.includes(index)
      ? done.filter((n) => n !== index)
      : [...done, index];
    setDone(next);
    writeDoneSteps(recipe.id, next);
    if (next.length === built.length) toast.success("All steps checked. Serve while hot!");
  };

  const copyRecipe = async () => {
    if (!recipe || recipe === "missing") return;
    const text = [
      recipe.title,
      `coci recipe · about ${recipe.minutes} minutes`,
      "",
      "Ingredients:",
      ...recipe.ingredients.map((ing) => `- ${ing}`),
      "",
      "Steps:",
      ...parseSteps(recipe.steps).map((s, i) => `${i + 1}. ${s}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Recipe copied. Paste it in chats, notes, anywhere.");
    } catch {
      toast.error("The browser blocked the copy.");
    }
  };

  const remove = async () => {
    if (!recipe || recipe === "missing") return;
    const sb = db();
    if (!sb) return;
    await sb.from("personal_recipes").delete().eq("id", recipe.id);
    toast.success("Recipe removed.");
    router.push("/recipes");
  };

  const toggleFavorite = async () => {
    if (!recipe || recipe === "missing") return;
    setRecipe({ ...recipe, favorite: !recipe.favorite });
    const sb = db();
    if (!sb) return;
    const { error } = await sb
      .from("personal_recipes")
      .update({ favorite: !recipe.favorite })
      .eq("id", recipe.id)
      .eq("user_id", session?.user?.id ?? "");
    if (error) {
      toast.error("Could not update the favorite.");
      setRecipe({ ...recipe, favorite: recipe.favorite });
    }
  };

  if (recipe === null) {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="py-8 text-sm text-mute">
            <span className="simmer">Finding the page...</span>
          </p>
        </main>
        <Footer />
      </>
    );
  }

  if (recipe === "missing") {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
          <BackButton fallbackHref="/recipes" label="Back to My recipes" />
          <div className="index-card mt-4 p-6">
            <h1 className="font-display text-2xl font-semibold">Not on this bookshelf</h1>
            <p className="mt-2 text-sm text-mute">
              That recipe either doesn&apos;t exist, was removed, or belongs to someone
              else&apos;s cookbook. Yours are under My recipes.
            </p>
            <Link
              href="/recipes"
              className="mt-4 inline-block rounded-sm bg-herb px-5 py-3 text-sm font-bold text-paper"
            >
              <ArrowLeft className="mr-1 inline size-4" aria-hidden="true" />
              Back to My recipes
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-3xl px-5 pb-24 pt-0 sm:px-8">
        <div className="pt-6">
          <BackButton fallbackHref="/recipes" label="Back to My recipes" />
        </div>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-semibold">{recipe.title}</h1>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-mute">
              <Clock3 className="size-4" aria-hidden="true" />
              {recipe.minutes} mins to cook
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void copyRecipe();
              }}
              aria-label={`Copy ${recipe.title} as text`}
              title="Copy this recipe"
              className="flex size-10 items-center justify-center rounded-full text-mute transition-colors hover:text-herb"
            >
              <Copy className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-pressed={recipe.favorite}
              onClick={() => void toggleFavorite()}
              aria-label={recipe.favorite ? `Unfavorite ${recipe.title}` : `Favorite ${recipe.title}`}
              className={`flex size-10 items-center justify-center rounded-full transition-colors ${
                recipe.favorite ? "bg-sun text-paper" : "text-mute hover:text-sun-deep"
              }`}
            >
              <Heart
                className="size-5"
                aria-hidden="true"
                {...(recipe.favorite ? { fill: "currentColor" } : {})}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                void remove();
              }}
              aria-label={`Remove ${recipe.title}`}
              className="flex size-10 items-center justify-center rounded-full text-brake transition-colors hover:bg-paper-deep"
            >
              <Trash2 className="size-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="index-card p-5">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <Carrot className="size-5 text-herb" aria-hidden="true" />
              Ingredients
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {recipe.ingredients.length === 0 && (
                <li className="text-mute">The page left these blank.</li>
              )}
              {recipe.ingredients.map((ing) => (
                <li key={ing} className="flex gap-2">
                  <span aria-hidden="true" className="text-herb">
                    ·
                  </span>
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 p-5">
            <button
              type="button"
              onClick={() => {
                stashPantryHandoff(recipe.ingredients);
                toast.success("Pantry packed. Writing your plan on the home page.");
                router.push("/");
              }}
              className="min-h-11 rounded-sm bg-brake px-5 py-3 text-sm font-bold text-on-brake transition-opacity hover:opacity-90"
            >
              Use this pantry for a plan
            </button>
            <Link
              href={`/assistant?about=${encodeURIComponent(
                `What am I missing to make ${recipe.title}?`,
              )}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-line bg-card px-5 py-3 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Ask Chef Pan about it
            </Link>
          </div>
        </section>

        {built.length > 0 && (
          <section className="mt-6">
            <header className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                <ChefHat className="size-5 text-herb" aria-hidden="true" />
                Cook it
              </h2>
              <button
                type="button"
                onClick={() => {
                  setDone([]);
                  writeDoneSteps(recipe.id, []);
                }}
                className="min-h-9 rounded-sm px-3 py-1 text-sm font-bold text-mute transition-colors hover:text-ink"
              >
                Start fresh
              </button>
            </header>
            <div
              role="progressbar"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={built.length}
              aria-label="Cooking progress"
              className="mt-2 h-2 overflow-hidden rounded-full bg-paper-deep"
            >
              <div
                className="h-full rounded-full bg-herb transition-all duration-500"
                style={{ width: `${finishProgress}%` }}
              />
            </div>

            <ul className="index-card mt-4 divide-y divide-line">
              {built.map((step, index) => {
                const ok = done.includes(index);
                return (
                  <li key={index}>
                    <button
                      type="button"
                      aria-pressed={ok}
                      onClick={() => toggleStep(index)}
                      className={`flex min-h-12 w-full items-start gap-3 px-3 py-3 text-left transition-colors ${
                        ok ? "text-mute" : "hover:bg-paper-deep"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          ok ? "bg-herb text-paper" : "bg-paper-deep"
                        }`}
                      >
                        {ok ? "✓" : index + 1}
                      </span>
                      <span className={`flex-1 text-sm leading-relaxed ${ok ? "line-through" : ""}`}>
                        {step}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <p className="mt-8 flex items-center gap-2 text-sm text-mute">
          <PanMascot className="size-5 text-mute" />
          Not sure about the next step? Ask Chef Pan from the pan in the corner.
        </p>
      </main>
      <Footer />
    </>
  );
}
