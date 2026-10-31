"use client";

/**
 * One chat brain for Chef Pan, used by both the /assistant page and the
 * floating dock, so either surface continues the same conversation
 * (session storage keeps it for the visit only - never sent anywhere
 * else, and nothing user-identifying is stored).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

const SESSION_KEY = "pantrypal.cookchat.v1";

export const GREETING: Turn = {
  role: "assistant",
  content:
    "Hi, I am Chef Pan. I cook the way lolas teach: cheap, fast, no waste. Ask me about a dish, an ingredient you are stuck with, or a budget, and I will answer straight.",
};

export const QUICK_ASKS = [
  "What can I make with 2 eggs and leftover rice?",
  "How do I keep sinigang from going bland?",
  "Is it okay to freeze cooked adobo?",
  "Cheapest way to cook for 4 on 300 pesos?",
];

export function useChefChat() {
  const [turns, setTurns] = useState<Turn[] | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const saved: Turn[] = raw ? JSON.parse(raw) : [];
      setTurns(Array.isArray(saved) && saved.length ? saved : [GREETING]);
    } catch {
      setTurns([GREETING]);
    }
  }, []);

  useEffect(() => {
    if (turns === null) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(turns.slice(-20)));
    } catch {
      // Storage blocked; the chat still lives this visit.
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || busy) return;
      const history = turns ?? [GREETING];
      setTurns([...history, { role: "user", content: text }]);
      setBusy(true);
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...history, { role: "user", content: text }].slice(-12),
          }),
        });
        const body = await res.json();
        if (!res.ok) {
          toast.error(body?.message ?? "Chef Pan is busy. Try again.");
          setTurns(history);
          return text; // handed back so the caller can refill the draft
        }
        setTurns([
          ...history,
          { role: "user", content: text },
          { role: "assistant", content: body.reply },
        ]);
      } catch {
        toast.error("Chef Pan is unreachable. Check your connection.");
        setTurns(history);
        return text;
      } finally {
        setBusy(false);
      }
      return "";
    },
    [busy, turns],
  );

  return { turns, busy, ask, bottomRef };
}
