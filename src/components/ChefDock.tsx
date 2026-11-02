"use client";

/**
 * The floating Chef Pan dock: one round mascot button in the corner that
 * opens a small chat on any page (bottom sheet on phones, corner box on
 * desktop). The /assistant page carries the same conversation, so the dock
 * stays hidden there. Everything rendered here is plain text, so answers
 * can never inject markup into the page.
 */
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { GREETING, QUICK_ASKS, useChefChat } from "@/lib/chef-chat";
import { CociMascot } from "./CociMascot";

/**
 * The chat avatar: a close-up of coci's face, reused on /assistant and
 * inside recipe cards via this named export.
 */
export function PanMascot({ className = "" }: { className?: string }) {
  return (
    <CociMascot
      className={className}
      viewBox="148 50 104 128"
    />
  );
}

export default function ChefDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { turns, busy, ask, bottomRef } = useChefChat();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  // The dedicated page already shows the full chat; nothing to duplicate.
  const onAssistantPage = pathname.startsWith("/assistant");

  useEffect(() => {
    if (!wasOpen.current && open) inputRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    fabRef.current?.focus(); // closing: hand focus back to the caller
  };

  const submit = (text: string) => {
    void ask(text).then((back) => {
      if (back) setDraft(back);
      else setDraft("");
    });
  };

  if (onAssistantPage) return null;

  return (
    <>
      {open && (
        <section
          id="chef-pan-dock"
          role="dialog"
          aria-label="Chef Pan, cooking help chat"
          className="fixed inset-x-0 bottom-0 z-40 flex max-h-[72dvh] min-h-[26rem] animate-pop flex-col overflow-hidden rounded-t-md border border-line bg-card shadow-[0_-2px_10px_rgb(0_0_0/12%)] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:max-h-none lg:h-[32rem] lg:w-96 lg:rounded-md lg:shadow-[0_4px_16px_rgb(0_0_0/16%)]"
        >
          <header className="flex items-center gap-2 border-b border-line bg-paper-deep px-4 py-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-herb text-paper">
              <PanMascot className="size-[22px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold leading-tight">Chef Pan</p>
              <p className="text-[11px] leading-tight text-mute">
                here to cook with you, anywhere
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close the Chef Pan chat"
              className="flex size-10 items-center justify-center rounded-sm text-mute transition-colors hover:text-herb"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          <div
            role="log"
            aria-live="polite"
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
          >
            {(turns ?? [GREETING]).map((turn, i) => (
              <div
                key={i}
                className={`max-w-[88%] rounded-md px-3 py-2 text-sm leading-relaxed ${
                  turn.role === "user" ? "ml-auto bg-herb text-paper" : "bg-paper-deep"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{turn.content}</p>
              </div>
            ))}
            {busy && (
              <div className="bg-paper-deep px-3 py-2 text-sm text-mute">
                <span className="simmer">Chef Pan is on it...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {turns !== null && turns.length <= 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-2">
              {QUICK_ASKS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => submit(q)}
                  className="min-h-9 whitespace-nowrap rounded-full border border-line bg-card px-3 py-1 text-xs font-bold transition-colors hover:border-herb hover:text-herb"
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
            className="flex gap-2 border-t border-line bg-card px-3 py-3"
          >
            <label htmlFor="chef-dock-input" className="sr-only">
              Ask the cook
            </label>
            <input
              id="chef-dock-input"
              ref={inputRef}
              type="text"
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about a dish, a peso, a pan..."
              className="h-11 min-w-0 flex-1 px-3 text-base"
            />
            <button
              type="submit"
              disabled={busy}
              aria-label="Send to Chef Pan"
              title="Send"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-sm bg-brake px-4 text-sm font-bold text-on-brake transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? (
                <span className="simmer">...</span>
              ) : (
                <PanMascot className="size-6" />
              )}
            </button>
          </form>
        </section>
      )}

      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chef-pan-dock"
        aria-label={open ? "Close the Chef Pan chat" : "Chat with Chef Pan"}
        title={open ? "Close Chef Pan" : "Chat with Chef Pan"}
        className="no-print fixed z-50 flex size-14 items-center justify-center rounded-full bg-brake text-on-brake shadow-[0_3px_8px_rgb(0_0_0/28%)] transition-transform hover:scale-105 max-lg:bottom-[calc(4.75rem+env(safe-area-inset-bottom))] max-lg:right-[calc(1rem+env(safe-area-inset-right))] lg:bottom-6 lg:right-6 lg:size-16"
      >
        {open ? <X className="size-6" aria-hidden="true" /> : <PanMascot className="size-10" />}
      </button>
    </>
  );
}
