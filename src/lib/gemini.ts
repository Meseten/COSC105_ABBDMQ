import { parsePlanResult, type MealPlanResult, type PlanRequest } from "./types";

/** Tried in order: low-latency lite lanes first, then the heavyweight lane. */
const MODEL_CHAIN = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash"];

const SYSTEM_INSTRUCTION = `SYSTEM ROLE:
You are an expert culinary AI and budget-conscious meal planner. Your objective is to generate highly practical, nutritious, and cost-effective meal plans and shopping lists based strictly on user-provided constraints.

TASK INSTRUCTIONS:
1. Analyze the user's provided input parameters: Available Ingredients, Dietary Preferences/Allergies, Budget Limit, and Meal Requirements.
2. Prioritize utilizing the user's "Available Ingredients" to minimize the required "Shopping List" and keep costs below the "Budget Limit".
3. Generate a day-by-day meal plan detailing specific recipes for each requested meal (e.g., breakfast, lunch, dinner).
4. Generate a consolidated shopping list that only includes ingredients the user does NOT already have. Estimate the cost of each item to ensure the total stays within budget.

STRICT CONSTRAINTS:
- You must respond ONLY with a valid, minified JSON object.
- Do NOT wrap the JSON in markdown code blocks (e.g., do not use \`\`\`json ... \`\`\`).
- Do NOT include any conversational text, pleasantries, explanations, or introductory phrases.
- Ensure all strings are properly escaped to prevent parsing errors.

Additional rules:
- mealPlan covers exactly the requested number of days, numbered 1..N, and each day has all three meals: breakfast, lunch, dinner.
- Respect dietary rules and the avoid list; never suggest anything that breaks them.
- Give each meal a specific, cookable dish name (not a category) and a one-sentence description.
- usedAvailableIngredients lists only the items from the pantry that meal actually uses; use [] when it is none.
- Quantities in the shopping list must be realistic to buy in a Philippine public market or grocery, and estimatedCost is a rough metro-Manila peso price per item in PHP.`;

const prettyFields = (r: PlanRequest): string =>
  [
    `Available Ingredients: ${r.ingredients.join(", ")}`,
    `Dietary Preferences/Allergies: ${r.diet === "" ? "none" : r.diet}${
      r.avoid.length ? `; avoid: ${r.avoid.join(", ")}` : ""
    }`,
    `Budget Limit: ${r.budgetAmount === null ? "none given" : `PHP ${r.budgetAmount}`}`,
    `Meal Requirements: ${r.days} day(s), ${r.servings} serving(s) per meal, breakfast + lunch + dinner every day`,
    `Cuisine preference: ${r.cuisine || "any; use familiar Filipino home cooking"}`,
    r.notes ? `Notes: ${r.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

function responseSchema(): object {
  const str = { type: "string" };
  const meal = {
    type: "object",
    properties: {
      name: str,
      description: str,
      usedAvailableIngredients: { type: "array", items: str },
    },
    required: ["name", "description", "usedAvailableIngredients"],
  };
  return {
    type: "object",
    properties: {
      mealPlan: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day: { type: "integer" },
            meals: {
              type: "object",
              properties: {
                breakfast: meal,
                lunch: meal,
                dinner: meal,
              },
              required: ["breakfast", "lunch", "dinner"],
            },
          },
          required: ["day", "meals"],
        },
      },
      shoppingList: {
        type: "array",
        items: {
          type: "object",
          properties: {
            itemName: str,
            quantity: str,
            estimatedCost: { type: "number" },
          },
          required: ["itemName", "quantity", "estimatedCost"],
        },
      },
      financialSummary: {
        type: "object",
        properties: {
          totalEstimatedCost: { type: "number" },
          currency: str,
          budgetStatus: str,
        },
        required: ["totalEstimatedCost", "currency", "budgetStatus"],
      },
    },
    required: ["mealPlan", "shoppingList", "financialSummary"],
  };
}

/** Calls Gemini with structured output and validates the returned plan. */
export async function generatePlan(request: PlanRequest): Promise<MealPlanResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  let lastDetail = "";
  let lastStatus = 502;
  for (const model of MODEL_CHAIN) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey ?? "",
        },
        signal: AbortSignal.timeout(55_000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [
            {
              role: "user",
              parts: [{ text: `Make me a meal plan.\n${prettyFields(request)}` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema(),
            // Deterministic output; temperature/top_p were deprecated 2026-07.
            thinkingConfig: { thinkingLevel: "low" },
            seed: 7,
          },
        }),
      },
    );

    if (res.ok) {
      const data = await res.json();
      const text: string | undefined =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned no content");

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Model occasionally wraps JSON in a code fence despite instructions.
        const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
        parsed = JSON.parse(cleaned);
      }

      return parsePlanResult(parsed, request);
    }

    const bodyText = await res.text().catch(() => "");
    let detail = "";
    try {
      detail = JSON.parse(bodyText)?.error?.message ?? "";
    } catch {
      // keep empty
    }
    lastDetail = detail;
    lastStatus = res.status;

    const retired =
      res.status === 404 && /no longer available|not found|not supported/i.test(detail);
    if (!retired && res.status !== 503) break;
    // Retired model or overloaded lane; try the next one in the chain.
  }

  if (lastStatus === 503) {
    throw new Error(`Gemini is busy (${lastDetail || "try again shortly"})`);
  }
  throw new Error(
    `Gemini request failed (${lastStatus}${lastDetail ? `: ${lastDetail}` : ""})`,
  );
}
