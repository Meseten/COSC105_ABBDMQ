"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { db } from "@/lib/db";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  const go = () => {
    toast.success(
      mode === "signin" ? "Welcome back. The kitchen is warm." : "Account created. Lunch is on us.",
    );
    router.push("/");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const sb = db();
    if (!sb) {
      toast.error("Storage is not configured for this build.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // An existing anonymous session gets upgraded so the kitchen carries over.
        const { data: current } = await sb.auth.getSession();
        if (current.session && !current.session.user.is_anonymous) {
          await sb.auth.signOut();
        }
        const { error } = await sb.auth.signUp({
          email,
          password,
          options: { data: { display_name: nickname.trim() || undefined } },
        });
        if (error) throw error;
      }
      go();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const sb = db();
    if (!sb) return;
    setBusy(true);
    try {
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(
        err instanceof Error && /provider/i.test(err.message)
          ? "Google sign-in is not enabled yet. The project owner can switch it on in the Supabase dashboard."
          : err instanceof Error
            ? err.message
            : "Could not start Google sign-in.",
      );
      setBusy(false);
    }
  };

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-md px-5 py-12 sm:py-16">
        <h1 className="font-display text-3xl font-semibold">
          {mode === "signin" ? "Welcome back" : "Set up your pantry book"}
        </h1>
        <p className="mt-2 text-sm text-mute">
          {mode === "signin"
            ? "Your kitchen, streaks and community likes come back with you."
            : "One account keeps your kitchen in sync and lets you post on the community board."}
        </p>

        <div className="mt-6 flex gap-1 rounded-sm bg-paper-deep p-1" role="tablist" aria-label="Sign in or create">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`min-h-10 flex-1 rounded-sm px-3 text-sm font-bold transition-colors ${
                mode === m ? "bg-card text-herb" : "text-mute hover:text-ink"
              }`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 flex flex-col gap-4" noValidate>
          {mode === "signup" && (
            <label className="flex flex-col gap-1 text-sm font-bold">
              Display name
              <input
                type="text"
                maxLength={40}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="How the community should call you"
                className="h-11 px-3 text-base font-normal"
                autoComplete="nickname"
              />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm font-bold">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 px-3 text-base font-normal"
              autoComplete="email"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="h-11 px-3 text-base font-normal"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-sm bg-brake px-6 py-3 text-base font-bold text-on-brake transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "One sec..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-mute">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={() => void google()}
          disabled={busy}
          className="flex min-h-11 w-full items-center justify-center gap-3 rounded-sm border border-line bg-card px-4 py-3 text-base font-bold transition-colors hover:border-herb hover:text-herb disabled:opacity-60"
        >
          {/* Official Google "G" logo (Google Sign-In brand asset, simplified). */}
          <svg viewBox="0 0 48 48" aria-hidden="true" className="size-5">
            <path
              fill="#4285F4"
              d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84a10.13 10.13 0 0 1-4.39 6.65v5.52h7.1c4.16-3.83 6.57-9.47 6.57-16.18z"
            />
            <path
              fill="#34A853"
              d="M24 46c5.94 0 10.92-1.97 14.56-5.32l-7.1-5.52c-1.97 1.32-4.49 2.1-7.46 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7A21.98 21.98 0 0 0 24 46z"
            />
            <path
              fill="#FBBC05"
              d="M11.69 28.19A13.2 13.2 0 0 1 11 24c0-1.45.25-2.87.69-4.19v-5.7H4.34A21.98 21.98 0 0 0 2 24c0 3.55.85 6.91 2.34 9.89l7.35-5.7z"
            />
            <path
              fill="#EA4335"
              d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 8.02 6.93 4.34 14.11l7.35 5.7c1.73-5.2 6.58-9.06 12.31-9.06z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-sm text-mute">
          By continuing you agree to the{" "}
          <Link href="/terms" className="font-bold text-herb underline underline-offset-4">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-bold text-herb underline underline-offset-4">
            Privacy note
          </Link>
          . Plans you save while signed in sync to your account; without an account they
          stay on this device.
        </p>
      </main>
      <Footer />
    </>
  );
}
