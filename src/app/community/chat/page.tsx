"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { db } from "@/lib/db";
import { getSignedInUserId } from "@/lib/plans";
import { loadChatHistory, sendChatMessage, type ChatMessageRow } from "@/lib/community";
import { useSession } from "@/lib/auth";

function when(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default function ChatRoomPage() {
  const session = useSession();
  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const [messages, setMessages] = useState<ChatMessageRow[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (session === undefined) return;
    let alive = true;
    void getSignedInUserId().then((uid) => {
      if (!alive) return;
      setUserId(uid);
      void loadChatHistory().then((list) => alive && setMessages(list));
    });

    const sb = db();
    const channel = sb?.channel("pantrypal-chat-room").on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
      },
      (payload) => {
        const row = payload.new as {
          id: number;
          user_id: string;
          content: string;
          created_at: string;
        } | null;
        if (!row) return;
        setMessages((prev) => {
          const list = prev ?? [];
          if (list.some((m) => String(m.id) === String(row.id))) return list;
          return [...list, row].slice(-80);
        });
      },
    );

    channel?.subscribe();
    return () => {
      alive = false;
      void channel?.unsubscribe();
    };
  }, [session]);

  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const list = messages ?? [];
    const missing = list
      .map((m) => m.user_id)
      .filter((id) => !(id in nameMap));
    if (missing.length === 0) return;
    let alive = true;
    const sb = db();
    if (!sb) return;
    void sb
      .from("profiles")
      .select("id, display_name")
      .in("id", [...new Set(missing)])
      .then(({ data }) => {
        if (!alive || !data) return;
        const next = { ...nameMap };
        for (const row of data as { id: string; display_name: string }[]) {
          next[row.id] = row.display_name;
        }
        setNameMap(next);
      });
    return () => {
      alive = false;
    };
  }, [messages, nameMap]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signedIn) {
      toast.error("Sign in to join the kitchen talk.");
      return;
    }
    if (!userId || !draft.trim()) return;
    const content = draft.trim().slice(0, 300);
    setDraft("");
    const posted = await sendChatMessage(content, userId);
    if (posted) {
      setMessages((prev) => [...(prev ?? []), posted].slice(-80));
    } else {
      toast.error("Message did not send. Try again.");
      setDraft(content);
    }
  };

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const remove = async (msg: ChatMessageRow) => {
    const sb = db();
    if (!sb || msg.user_id !== userId) return;
    setMessages((prev) => prev?.filter((m) => m.id !== msg.id) ?? null);
    await sb.from("chat_messages").delete().eq("id", msg.id);
  };

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto flex max-w-2xl flex-col px-5 sm:px-8" style={{ height: "70vh", minHeight: 420 }}>
        <section className="py-6">
          <h1 className="font-display text-3xl font-semibold">Kitchen talk</h1>
          <p className="mt-1 text-sm text-mute">
            A live room for the neighborhood: swap warnings, market finds and last-minute
            swaps. {signedIn ? "You are in as yourself." : "Sign in to post."}
          </p>
        </section>

        <div className="index-card flex min-h-0 flex-1 flex-col p-0">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {messages === null ? (
              <p className="text-sm text-mute">
                <span className="simmer">Listening for footsteps...</span>
              </p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-mute">
                Quiet room. Say what you are cooking tonight.
              </p>
            ) : (
              [...messages].reverse().map((m) => (
                <div key={m.id} className="animate-pop flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold">
                      {m.user_id === userId ? "You" : nameMap[m.user_id] ?? "a cook"}
                    </span>
                    <span className="text-xs text-mute">{when(m.created_at)}</span>
                    {m.user_id === userId && (
                      <button
                        type="button"
                        onClick={() => void remove(m)}
                        className="text-xs text-brake hover:underline"
                        aria-label="Delete message"
                      >
                        delete
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm break-words">{m.content}</p>
                </div>
              ))
            )}
            <div ref={topRef} />
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <input
              id="chat-input"
              type="text"
              value={draft}
              maxLength={300}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={signedIn ? "Say hi, or what's for dinner..." : "Sign in to post"}
              className="h-11 min-w-0 flex-1 px-3 text-base"
            />
            <button
              type="submit"
              className="min-h-11 rounded-sm bg-herb px-4 text-sm font-bold text-paper transition-opacity hover:opacity-90"
            >
              Send
            </button>
          </form>
        </div>
        <p className="my-3 text-center text-xs text-mute">
          Be decent in here; the community keeps the room clean. Read the{" "}
          <Link href="/terms" className="underline underline-offset-2">
            house rules
          </Link>
          .
        </p>
      </main>
      <Footer />
    </>
  );
}
