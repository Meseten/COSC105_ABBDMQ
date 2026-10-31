"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import PlanView from "./PlanView";
import { pullPantryHandoff, savePlan } from "@/lib/plans";
import type { MealPlanResult, PlanApiError } from "@/lib/types";

const EXAMPLE_PANTRY = [
  "rice",
  "eggs",
  "garlic",
  "onion",
  "tomatoes",
  "chicken",
  "soy sauce",
];

const DIETS = [
  "None",
  "Halal",
  "No pork",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Low-sodium",
  "Gluten-free",
];
const CUISINES = [
  "Any",
  "Filipino",
  "Chinese",
  "Japanese",
  "Korean",
  "Thai",
  "Italian",
  "Mexican",
];

const LOADING_LINES = [
  "Checking what you already have...",
  "Browsing market prices...",
  "Balancing rice against ulam...",
  "Timing laundry day with leftover night...",
];

function TagField({
  id,
  label,
  hint,
  tags,
  setTags,
  input,
  setInput,
  placeholder,
}: {
  id: string;
  label: string;
  hint: string;
  tags: string[];
  setTags: (next: string[]) => void;
  input: string;
  setInput: (next: string) => void;
  placeholder: string;
}) {
  const commit = (raw: string) => {
    const parts = raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const next = [...new Set([...tags, ...parts])].slice(0, 60);
    setTags(next);
    setInput("");
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">
        {label}
      </label>
      <p className="mb-2 text-sm text-mute">{hint}</p>
      <div className="flex flex-wrap gap-2 py-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded bg-paper-deep px-2 py-1 text-sm font-bold"
          >
            {tag}
            <button
              type="button"
              onClick={() => setTags(tags.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="flex size-5 items-center justify-center rounded-full text-mute transition-colors hover:bg-brake hover:text-on-brake"
            >
              <svg viewBox="0 0 10 10" aria-hidden="true" className="size-2.5">
                <path
                  d="M1 1l8 8M9 1l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </span>
        ))}
      </div>
      <input
        id={id}
        type="text"
        value={input}
        placeholder={placeholder}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit(input);
          } else if (e.key === "Backspace" && !input && tags.length) {
            setTags(tags.slice(0, -1));
          }
        }}
        onBlur={() => commit(input)}
        className="h-11 w-full px-3 text-base"
      />
    </div>
  );
}

const MEMORY_KEY = "pantrypal.planner.v1";

interface PlannerMemory {
  ingredients: string[];
  avoid: string[];
  servings: number;
  days: number;
  budgetAmount: string;
  diet: string;
  cuisine: string;
  notes: string;
}

function loadMemory(): PlannerMemory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as Partial<PlannerMemory>;
    return {
      ingredients: Array.isArray(m.ingredients) ? m.ingredients.slice(0, 60) : [],
      avoid: Array.isArray(m.avoid) ? m.avoid.slice(0, 60) : [],
      servings: typeof m.servings === "number" && m.servings >= 1 ? Math.min(12, Math.round(m.servings)) : 2,
      days: typeof m.days === "number" && m.days >= 1 ? Math.min(7, Math.round(m.days)) : 3,
      budgetAmount: typeof m.budgetAmount === "string" ? m.budgetAmount.slice(0, 12) : "",
      diet: typeof m.diet === "string" ? m.diet : "None",
      cuisine: typeof m.cuisine === "string" ? m.cuisine : "Any",
      notes: typeof m.notes === "string" ? m.notes.slice(0, 600) : "",
    };
  } catch {
    return null;
  }
}

function writeMemory(m: PlannerMemory): void {
  try {
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(m));
  } catch {
    // storage blocked; pantry just won't persist
  }
}

export default function PlannerForm() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [avoid, setAvoid] = useState<string[]>([]);
  const [avoidInput, setAvoidInput] = useState("");
  const [servings, setServings] = useState(2);
  const [days, setDays] = useState(3);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [diet, setDiet] = useState("None");
  const [cuisine, setCuisine] = useState("Any");
  const [notes, setNotes] = useState("");
  const [booted, setBooted] = useState(false);

  // Remembered pantry + settings greet you; a stashed recipe hand-off wins.
  useEffect(() => {
    if (booted) return;
    const handoff = pullPantryHandoff();
    const memory = loadMemory();
    if (memory && handoff === null) {
      setIngredients(memory.ingredients);
      setAvoid(memory.avoid);
      setServings(memory.servings);
      setDays(memory.days);
      setBudgetAmount(memory.budgetAmount);
      setDiet(memory.diet);
      setCuisine(memory.cuisine);
      setNotes(memory.notes);
    }
    if (handoff !== null) {
      setIngredients(handoff);
      toast.success("Pantry packed from your recipe. Tune the numbers below.");
    }
    setBooted(true);
  }, [booted]);

  useEffect(() => {
    if (!booted) return;
    writeMemory({ ingredients, avoid, servings, days, budgetAmount, diet, cuisine, notes });
  }, [booted, ingredients, avoid, servings, days, budgetAmount, diet, cuisine, notes]);

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(
    "idle",
  );
  const [errorText, setErrorText] = useState("");
  const [plan, setPlan] = useState<MealPlanResult | null>(null);

  const useExample = () => {
    setIngredients(EXAMPLE_PANTRY);
    setIngredientInput("");
  };

  const submit = async () => {
    if (!ingredients.length) {
      setStatus("error");
      setErrorText("Add at least one ingredient you already have.");
      return;
    }
    const budgetNum =
      budgetAmount.trim() === "" ? null : Number(budgetAmount.replace(/[^0-9.]/g, ""));
    if (budgetNum !== null && (!Number.isFinite(budgetNum) || budgetNum <= 0)) {
      setStatus("error");
      setErrorText("Enter a budget as a plain number, like 500.");
      return;
    }

    setStatus("loading");
    setErrorText("");
    setPlan(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients,
          avoid,
          servings,
          days,
          budgetAmount: budgetNum,
          diet: diet === "None" ? "" : diet,
          cuisine: cuisine === "Any" ? "" : cuisine,
          notes,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        const apiError = body as PlanApiError;
        setStatus("error");
        setErrorText(apiError?.message ?? "Something went wrong. Try again.");
        return;
      }
      setPlan(body.plan as MealPlanResult);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorText(
        navigator.onLine
          ? "The plan request failed. Check your connection and try again."
          : "You are offline. Reconnect to make a new plan, or open your Kitchen where saved plans still work.",
      );
    }
  };

  const doSave = async () => {
    if (!plan) return;
    try {
      const saved = await savePlan(plan);
      toast.success("Saved to your kitchen board.");
      if (!saved) return;
    } catch {
      toast.error("Could not save the plan.");
    }
  };

  const busy = status === "loading";
  const loadingLine = LOADING_LINES[Math.min(LOADING_LINES.length - 1, (days + 1) % LOADING_LINES.length)];

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="index-card p-5 sm:p-7"
        noValidate
      >
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-semibold">Your pantry</h2>
          <button
            type="button"
            onClick={useExample}
            className="text-sm font-bold text-herb underline underline-offset-4 hover:opacity-80"
          >
            Use an example pantry
          </button>
        </div>

        <TagField
          id="ingredients"
          label="What do you already have?"
          hint="Type one ingredient, press Enter or comma to add it."
          tags={ingredients}
          setTags={setIngredients}
          input={ingredientInput}
          setInput={setIngredientInput}
          placeholder="rice, eggs, garlic..."
        />

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="servings" className="mb-1 block text-sm font-bold">
              People per meal
            </label>
            <input
              id="servings"
              type="number"
              min="1"
              max="12"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="h-11 w-full px-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="days" className="mb-1 block text-sm font-bold">
              Days to plan
            </label>
            <select
              id="days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-11 w-full px-3 text-base"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {d === 7 ? "7 (a full week)" : `${d}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="budget" className="mb-1 block text-sm font-bold">
              Grocery budget in pesos
              <span className="ml-1 font-normal text-mute">optional</span>
            </label>
            <input
              id="budget"
              type="number"
              min="0"
              step="10"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="500"
              className="h-11 w-full px-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="diet" className="mb-1 block text-sm font-bold">
              Diet rules
            </label>
            <select
              id="diet"
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="h-11 w-full px-3 text-base"
            >
              {DIETS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cuisine" className="mb-1 block text-sm font-bold">
              Cuisine
            </label>
            <select
              id="cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="h-11 w-full px-3 text-base"
            >
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <TagField
            id="avoid"
            label="Avoid these"
            hint="Ingredients or dishes nobody in the house eats."
            tags={avoid}
            setTags={setAvoid}
            input={avoidInput}
            setInput={setAvoidInput}
            placeholder="peanuts, spicy food..."
          />
        </div>

        <div className="mt-5">
          <label htmlFor="notes" className="mb-1 block text-sm font-bold">
            Anything else
            <span className="ml-1 font-normal text-mute">optional</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. we share lunch with a neighbor, kids hate leftovers two days in a row, there is a rice cooker but no oven"
            className="w-full px-3 py-2 text-base sm:max-w-xl"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-6 min-h-11 w-full rounded-sm bg-brake px-6 py-3 text-base font-bold text-on-brake transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {busy ? "Drafting your plan..." : "Write my meal plan"}
        </button>
        <p aria-live="polite" className="mt-3 text-sm text-mute">
          {busy
            ? loadingLine
            : "Your ingredients, budget and notes are sent to Google Gemini through PantryPal's server; the API key never touches your browser."}
        </p>

        {status === "error" && (
          <div
            role="alert"
            className="mt-4 rounded-sm border-l-4 border-brake bg-paper-deep px-4 py-3 text-sm"
          >
            <p className="font-bold">Could not make a plan</p>
            <p className="mt-1">{errorText}</p>
          </div>
        )}
      </form>

      {plan && (
        <div className="mt-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void doSave()}
              className="rounded-sm border border-herb bg-card px-5 py-3 text-base font-bold text-herb transition-colors hover:bg-herb hover:text-paper"
            >
              Save to my kitchen
            </button>
          </div>
          <PlanView plan={plan} />
        </div>
      )}
    </div>
  );
}
