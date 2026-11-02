"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CircleHelp, MessageCircleHeart, Send } from "lucide-react";
import Masthead from "@/components/Masthead";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";
import { db } from "@/lib/db";
import { useSession } from "@/lib/auth";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does coci actually do?",
    a: "You list the ingredients you already have, set servings, days, diet and a peso budget, and it drafts a day-by-day meal plan plus a shopping list of only the missing items. Plans save to your kitchen board and, when signed in, to your account.",
  },
  {
    q: "What does saving a plan cost me in effort?",
    a: "One tap. The plan lands on your kitchen board where you can pin it, search it, export it as a text file, share it to the community board, or delete it.",
  },
  {
    q: "Where is my data kept?",
    a: "Without an account: on this device only. With an account: your profiles, plans, shared posts, likes and recipes are stored in a Supabase database, protected by row-level security so only you can read your own rows. Chef Pan's chats live in your browser for the session, not on our servers.",
  },
  {
    q: "How do XP, levels and streaks work?",
    a: "Saving your first plan of the day grants XP once per server, not per refresh. XP builds levels, a daily save builds your streak, and milestones award badges. The top-cooks list ranks everyone by XP.",
  },
  {
    q: "Who can delete community posts?",
    a: "You can delete your own posts any time. Moderators and the admin role can remove any post or chat message that breaks the house rules. The rules and role system are enforced in the database, so the button simply does not appear for regular cooks.",
  },
  {
    q: "How do I delete everything?",
    a: "Account settings has a download for a full copy of your data (JSON) and a danger zone that erases your account plus every related row (plans, posts, likes, chats, recipes) immediately.",
  },
  {
    q: "Why did Chef Pan stop answering?",
    a: "Chef Pan answers through Google's Gemini service. If the free tier is busy it retries other lanes automatically. If it still fails, wait a few seconds and ask again. Your rate limit is one question every few seconds so the shared key stays fair.",
  },
];

const TOPICS = [
  { code: "general", label: "General" },
  { code: "bug", label: "Something broke" },
  { code: "idea", label: "A feature idea" },
  { code: "content", label: "Bad community post" },
  { code: "account", label: "My account or data" },
];

export default function HelpPage() {
  const session = useSession();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [topic, setTopic] = useState("general");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? FAQ.filter((f) => (f.q + f.a).toLowerCase().includes(q)) : FAQ;
  }, [query]);

  const send = async () => {
    if (message.trim().length < 5) {
      toast.error("Tell us a bit more than a wave.");
      return;
    }
    setBusy(true);
    try {
      const sb = db();
      if (!sb) throw new Error("Storage not configured.");
      const { error } = await sb.from("feedback").insert({
        topic,
        message: message.trim().slice(0, 2000),
        page: window.location.pathname,
      });
      if (error) throw error;
      setMessage("");
      toast.success("Feedback received. Thank you!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send feedback.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-3xl px-5 sm:px-8">
        <section className="py-8">
          <BackButton fallbackHref="/" label="Back home" />
          <h1 className="flex items-center gap-2 font-display text-3xl font-semibold">
            <CircleHelp className="size-7 text-herb" aria-hidden="true" />
            Help & feedback
          </h1>
          <p className="mt-1 text-sm text-mute">
            Quick answers first. If that misses, the feedback form below reaches the
            developer directly.
          </p>
        </section>

        <label className="flex flex-col gap-1 text-sm font-bold">
          <span className="sr-only">Search the help answers</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: streaks, moderation, delete account..."
            className="h-11 px-3 text-base font-normal"
          />
        </label>

        <ul className="mt-4 flex flex-col gap-2">
          {shown.map((f) => {
            const isOpen = open === f.q;
            return (
              <li key={f.q} className="index-card overflow-hidden">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : f.q)}
                  className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-bold transition-colors hover:bg-paper-deep"
                >
                  {f.q}
                  <span aria-hidden="true" className={`text-herb transition-transform ${isOpen ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                {isOpen && <p className="px-4 pb-4 text-sm text-mute">{f.a}</p>}
              </li>
            );
          })}
          {shown.length === 0 && (
            <li className="py-6 text-sm text-mute">
              Nothing matches “{query}”. Try a shorter word, or send feedback below.
            </li>
          )}
        </ul>

        <section className="index-card my-10 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <MessageCircleHeart className="size-5 text-herb" aria-hidden="true" />
            Send feedback
          </h2>
          <p className="mt-1 text-xs text-mute">
            {session === undefined
              ? "Deciding who you are..."
              : (session && !session.user.is_anonymous)
                ? "Signed in: feedback lands in the admin inbox tied to your account."
                : "Sending as a guest: the developer still reads every message."}
          </p>
          <label className="mt-3 flex flex-col gap-1 text-sm font-bold">
            Topic
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-11 px-3 text-base font-normal"
            >
              {TOPICS.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 flex flex-col gap-1 text-sm font-bold">
            Message
            <textarea
              value={message}
              rows={4}
              maxLength={2000}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What helped? What broke? What should we cook up next?"
              className="px-3 py-2 text-base font-normal"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-herb px-5 text-sm font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Send className="size-4" aria-hidden="true" />
              {busy ? "Sending..." : "Send it"}
            </button>
            <span className="text-xs text-mute">
              Urgent problems (account or data):{" "}
              <a
                href="mailto:benjamesduag.edu@gmail.com"
                className="font-bold text-herb underline underline-offset-4"
              >
                benjamesduag.edu@gmail.com
              </a>
            </span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
