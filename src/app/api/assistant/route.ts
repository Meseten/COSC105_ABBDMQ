import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Tried in order: low-latency lite lanes first, then the heavyweight lane. */
const MODEL_CHAIN = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash"];

const SYSTEM_INSTRUCTION = `You are a friendly home cook who has cooked professionally in small Philippine kitchens.
You answer cooking questions from students and families who cook on a budget.

How you answer:
- Plain, warm and short: 2 to 5 sentences, or a short list when steps help.
- No lecture voice, no filler words. Speak like a person who cooks every day.
- Practical over perfect: cheaper swaps, tool-free methods, market tips are welcome.
- Recipe requests: give the dish name, ingredients with rough amounts, and numbered steps a beginner can follow. Keep it under about 12 steps.
- If someone asks about something unsafe (spoiled food, wrong storage, undercooked meat), name the risk plainly and say what to do instead.
- If the question is not about food, cooking, or kitchen tools, say briefly that you only talk food, and offer a food question back.`;

interface ChatTurn {
  role?: unknown;
  content?: unknown;
}

const lastHitByIp = new Map<string, number>();
const COOLDOWN_MS = 3_000;

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
  if (now - (lastHitByIp.get(ip) ?? 0) < COOLDOWN_MS) {
    return NextResponse.json(
      { error: "rate_limited", message: "One question at a time. Give it a few seconds." },
      { status: 429 },
    );
  }
  lastHitByIp.set(ip, now);

  const body = (await request.json().catch(() => null)) as { messages?: unknown } | null;
  const raw = Array.isArray(body?.messages) ? (body!.messages as ChatTurn[]) : [];
  const turns = raw
    .filter(
      (t) =>
        (t.role === "user" || t.role === "assistant") &&
        typeof t.content === "string" &&
        t.content.trim().length > 0,
    )
    .map((t) => ({
      role: t.role as "user" | "assistant",
      content: (t.content as string).trim().slice(0, 2000),
    }))
    .slice(-12);

  if (turns.length === 0 || turns[turns.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "bad_request", message: "Ask a cooking question first." },
      { status: 400 },
    );
  }

  let lastDetail = "";
  let lastStatus = 502;
  let reply: string | null = null;
  for (const model of MODEL_CHAIN) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
        },
        signal: AbortSignal.timeout(45_000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: turns.map((t) => ({
            role: t.role,
            parts: [{ text: t.content }],
          })),
          generationConfig: {
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingLevel: "low" },
          },
        }),
      },
    );

    if (!res.ok) {
      lastStatus = res.status;
      lastDetail = await res.text().catch(() => "");
      const retired =
        res.status === 404 &&
        /no longer available|not found|not supported/i.test(lastDetail);
      if (!retired && res.status !== 503) break;
      continue; // retired or overloaded; try the next lane
    }

    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p?.text ?? "")
      .join("");
    if (text) {
      reply = text.trim().slice(0, 4000);
      break;
    }
    break;
  }

  if (reply) return NextResponse.json({ reply });
  if (lastStatus === 503) {
    return NextResponse.json(
      { error: "upstream", message: "Gemini is busy. Ask again in a few seconds." },
      { status: 502 },
    );
  }
  return NextResponse.json(
    {
      error: "upstream",
      message: `Cook talk failed (${lastStatus}). ${lastDetail.slice(0, 200)}`,
    },
    { status: 502 },
  );
}
