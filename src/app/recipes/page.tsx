"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Heart,
  Clock3,
  Plus,
  Trash2,
  Coins,
  CookingPot,
  Drumstick,
  Egg,
  Leaf,
  PartyPopper,
} from "lucide-react";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { db } from "@/lib/db";
import { useSession } from "@/lib/auth";
import { getSignedInUserId } from "@/lib/plans";

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

const CATEGORIES: { code: string; label: string }[] = [
  { code: "any", label: "Everyday" },
  { code: "quick", label: "Quick & easy" },
  { code: "veg", label: "Vegetable-forward" },
  { code: "protein", label: "High protein" },
  { code: "budget", label: "Budget saver" },
  { code: "party", label: "Pulutan & parties" },
];

const TILES: Record<string, { Icon: typeof CookingPot; label: string }> = {
  any: { Icon: CookingPot, label: "Everyday pot" },
  quick: { Icon: Egg, label: "Quick dish" },
  veg: { Icon: Leaf, label: "Vegetable dish" },
  protein: { Icon: Drumstick, label: "Protein dish" },
  budget: { Icon: Coins, label: "Budget dish" },
  party: { Icon: PartyPopper, label: "Party dish" },
};

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
}

export default function RecipesPage() {
  const session = useSession();
  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [query, setQuery] = useState("");

  // form state
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [category, setCategory] = useState("any");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const userId = await getSignedInUserId();
    const sb = userId ? db() : null;
    if (!userId || !sb) {
      setRecipes([]);
      return;
    }
    const { data, error } = await sb
      .from("personal_recipes")
      .select("id, title, minutes, category, ingredients, steps, favorite, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    setRecipes(error ? [] : ((data ?? []) as Recipe[]));
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!signedIn) {
      setRecipes([]);
      return;
    }
    void load();
  }, [session, signedIn, load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnlyFavorites(new URLSearchParams(window.location.search).get("favorites") === "1");
  }, []);

  const add = async () => {
    const t = title.trim();
    if (t.length < 2) {
      toast.error("Give the recipe a name first.");
      return;
    }
    setBusy(true);
    try {
      const sb = db();
      if (!sb) throw new Error("Storage not configured.");
      const list = ingredients
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 25);
      const { error } = await sb.from("personal_recipes").insert({
        title: t,
        minutes: Math.min(600, Math.max(1, Number(minutes) || 30)),
        category,
        ingredients: list,
        steps: steps.slice(0, 4000),
      });
      if (error) throw error;
      toast.success("Added to your cookbook.");
      setShowForm(false);
      setTitle("");
      setIngredients("");
      setSteps("");
      setMinutes("30");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the recipe.");
    } finally {
      setBusy(false);
    }
  };

  const toggleFavorite = async (r: Recipe) => {
    setRecipes((cur) =>
      (cur ?? []).map((x) => (x.id === r.id ? { ...x, favorite: !x.favorite } : x)),
    );
    const sb = db();
    if (!sb) return;
    const { error } = await sb
      .from("personal_recipes")
      .update({ favorite: !r.favorite })
      .eq("id", r.id);
    if (error) {
      toast.error("Could not update the favorite.");
      void load();
    }
  };

  const remove = async (r: Recipe) => {
    setRecipes((cur) => (cur ?? []).filter((x) => x.id !== r.id));
    const sb = db();
    if (!sb) return;
    await sb.from("personal_recipes").delete().eq("id", r.id);
    toast.success("Recipe removed.");
  };

  const shown = (recipes ?? [])
    .filter((r) => (onlyFavorites ? r.favorite : true))
    .filter((r) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.toLowerCase().includes(q))
      );
    });

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-5xl px-5 sm:px-8">
        <section className="py-8 sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div>
            <h1 className="font-display text-3xl font-semibold">My recipes</h1>
            <p className="mt-1 max-w-xl text-sm text-mute">
              Your own cookbook: hand-me-downs, experiments and the dishes you cook from
              memory. Favorites are the ones you keep returning to.
            </p>
          </div>
          {signedIn && (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="mt-4 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm bg-herb px-5 text-sm font-bold text-paper transition-opacity hover:opacity-90 sm:mt-0"
            >
              <Plus className="size-4" aria-hidden="true" />
              {showForm ? "Close the form" : "Add new recipe"}
            </button>
          )}
        </section>

        {!signedIn ? (
          <div className="index-card mb-10 max-w-xl p-6">
            <p className="font-display text-xl font-semibold">A cookbook needs an account</p>
            <p className="mt-2 text-sm text-mute">
              Sign in to keep your recipes on every device and share them straight into
              a plan. Everything else still works without one.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-sm bg-herb px-5 py-3 text-sm font-bold text-paper"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <>
            {showForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void add();
                }}
                className="index-card mb-6 flex flex-col gap-3 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="flex flex-1 flex-col gap-1 text-sm font-bold">
                    Recipe name
                    <input
                      type="text"
                      value={title}
                      maxLength={80}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Lola's tinola"
                      className="h-11 px-3 text-base font-normal"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-bold sm:w-36">
                    Cook time (min)
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="h-11 px-3 text-base font-normal"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-bold sm:w-52">
                    Category
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-11 px-3 text-base font-normal"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-sm font-bold">
                  Ingredients (one per line)
                  <textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    rows={3}
                    placeholder={"2 cups rice\n1 tbsp garlic, minced\n6 cups water"}
                    className="px-3 py-2 text-base font-normal"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-bold">
                  How to cook it
                  <textarea
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    rows={4}
                    placeholder="Sauté the garlic until golden..."
                    className="px-3 py-2 text-base font-normal"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-11 self-start rounded-sm bg-brake px-5 text-sm font-bold text-on-brake transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? "Saving..." : "Save recipe"}
                </button>
              </form>
            )}

            {recipes !== null && recipes.length > 4 && (
              <label className="mb-4 flex flex-col gap-1 text-sm font-bold">
                <span className="sr-only">Search your recipes</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or ingredient: “tinola”, “eggplant”…"
                  className="h-11 px-3 text-base font-normal"
                />
              </label>
            )}

            <div className="mb-6 flex gap-2" role="group" aria-label="Filter recipes">
              <button
                type="button"
                aria-pressed={!onlyFavorites}
                onClick={() => {
                  setOnlyFavorites(false);
                  window.history.replaceState(null, "", "/recipes");
                }}
                className={`min-h-10 rounded-full border px-4 text-sm font-bold transition-colors ${
                  !onlyFavorites
                    ? "border-herb bg-herb text-paper"
                    : "border-line bg-card hover:border-herb hover:text-herb"
                }`}
              >
                All
              </button>
              <button
                type="button"
                aria-pressed={onlyFavorites}
                onClick={() => {
                  setOnlyFavorites(true);
                  window.history.replaceState(null, "", "/recipes?favorites=1");
                }}
                className={`min-h-10 inline-flex items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${
                  onlyFavorites
                    ? "border-sun bg-sun text-paper"
                    : "border-line bg-card hover:border-sun hover:text-sun-deep"
                }`}
              >
                <Heart className="size-4" aria-hidden="true" />
                Favorites only
              </button>
            </div>

            {recipes === null ? (
              <p className="py-8 text-sm text-mute">
                <span className="simmer">Leafing through the cookbook...</span>
              </p>
            ) : recipes.length === 0 ? (
              <div className="index-card mb-10 max-w-xl p-6">
                <p className="font-display text-xl font-semibold">No pages yet</p>
                <p className="mt-2 text-sm text-mute">
                  Write down the first dish you can cook without checking anything. That
                  one you already know by heart is a real recipe.
                </p>
              </div>
            ) : shown.length === 0 && onlyFavorites ? (
              <p className="py-8 text-sm text-mute">No favorites yet — tap the heart on a recipe.</p>
            ) : shown.length === 0 && query.trim() ? (
              <p className="py-8 text-sm text-mute">Nothing matches “{query}”.</p>
            ) : shown.length === 0 ? (
              <p className="py-8 text-sm text-mute">Nothing on the shelf matches.</p>
            ) : (
              <ul className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((r) => (
                  <li
                    key={r.id}
                    className="index-card animate-rise flex flex-col p-4 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-14 items-center justify-center rounded-md bg-paper-deep text-herb">
                        {(() => {
                          const tile = TILES[r.category] ?? TILES.any;
                          return (
                            <>
                              <tile.Icon className="size-7" aria-hidden="true" />
                              <span className="sr-only">{tile.label}</span>
                            </>
                          );
                        })()}
                      </span>
                      <button
                        type="button"
                        aria-pressed={r.favorite}
                        aria-label={r.favorite ? `Unfavorite ${r.title}` : `Favorite ${r.title}`}
                        onClick={() => void toggleFavorite(r)}
                        className={`flex size-9 items-center justify-center rounded-full transition-colors ${
                          r.favorite ? "bg-sun text-paper" : "text-mute hover:text-sun-deep"
                        }`}
                      >
                        <Heart
                          className="size-4"
                          aria-hidden="true"
                          {...(r.favorite ? { fill: "currentColor" } : {})}
                        />
                      </button>
                    </div>
                    <h2 className="mt-2 font-display text-lg font-semibold">
                      <Link
                        href={`/recipes/${r.id}`}
                        className="transition-colors hover:text-herb hover:underline hover:underline-offset-4"
                      >
                        {r.title}
                      </Link>
                    </h2>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-mute">
                      <Clock3 className="size-3.5" aria-hidden="true" />
                      {r.minutes} mins ·{" "}
                      {CATEGORIES.find((c) => c.code === r.category)?.label ?? "Everyday"}
                    </p>
                    {r.ingredients.length > 0 && (
                      <p className="mt-1 line-clamp-2 text-xs text-mute">
                        {r.ingredients.slice(0, 4).join(", ")}
                        {r.ingredients.length > 4 ? ` +${r.ingredients.length - 4} more` : ""}
                      </p>
                    )}
                    {r.steps && (
                      <p className="mt-1 line-clamp-2 text-xs text-mute italic">{r.steps}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-mute">{fmtDate(r.created_at)}</span>
                      <button
                        type="button"
                        onClick={() => void remove(r)}
                        className="inline-flex min-h-9 items-center gap-1 rounded-sm px-2 text-sm font-bold text-brake transition-colors hover:bg-paper-deep"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
