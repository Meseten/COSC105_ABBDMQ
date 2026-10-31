"use client";

import { useEffect, useRef, useState } from "react";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { PanMascot } from "@/components/ChefDock";
import { QUICK_ASKS, useChefChat } from "@/lib/chef-chat";

export default function AssistantPage() {
  const { turns, busy, ask, bottomRef } = useChefChat();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // /assistant?about=... pre-fills the ask box (recipes link over).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("about");
    if (!q) return;
    setDraft(q.slice(0, 300));
    window.history.replaceState(null, "", "/assistant");
    inputRef.current?.focus();
  }, []);

  const submit = (text: string) => {
    void ask(text).then((back) => {
      if (back) setDraft(back);
      else setDraft("");
    });
  };

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-2xl px-5 sm:px-8">
        <section className="py-8">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-herb text-paper">
              <PanMascot className="size-8" />
            </span>
            <h1 className="font-display text-3xl font-semibold">Chef Pan</h1>
          </div>
          <p className="mt-2 text-sm text-mute">
            A home cook on call: recipe help, swaps, food-safety gut checks, and how to
            stretch a peso. On other pages, tap the pan in the corner to bring me along.
          </p>
        </section>

        {turns === null ? (
          <p className="py-8 text-sm text-mute">
            <span className="simmer">Warming the pan...</span>
          </p>
        ) : (
          <div
            role="log"
            aria-live="polite"
            className="flex flex-col gap-4"
          >
            {turns.map((turn, i) => (
              <div
                key={i}
                className={`animate-pop max-w-[92%] rounded-md px-4 py-3 text-base leading-relaxed ${
                  turn.role === "user"
                    ? "ml-auto bg-herb text-paper"
                    : "bg-paper-deep"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{turn.content}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {turns !== null && turns.length <= 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_ASKS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => submit(q)}
                className="min-h-10 rounded-full border border-line bg-card px-4 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
          className="my-6 flex gap-2"
        >
          <label htmlFor="chat-input" className="sr-only">
            Ask the cook
          </label>
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={draft}
            maxLength={2000}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. my beef keeps getting tough, what am I doing wrong?"
            className="h-12 min-w-0 flex-1 px-4 text-base"
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 rounded-sm bg-brake px-6 text-base font-bold text-on-brake transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Chef Pan is on it..." : "Ask"}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
