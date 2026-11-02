"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import Rail from "./Rail";
import CociLogo from "./CociLogo";
import NotificationBell from "./NotificationBell";
import { signOut, useSession } from "@/lib/auth";

export default function Masthead() {
  const router = useRouter();
  const session = useSession();
  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;

  return (
    <>
      <Rail />
      <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-herb transition-opacity hover:opacity-80"
            aria-label="coci, back to the planner"
          >
            <CociLogo className="size-8 shrink-0" />
            <span className="font-display text-[1.7rem] font-semibold lowercase leading-none tracking-tight">
              coci
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {signedIn && <NotificationBell />}
            {session === undefined ? (
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-full bg-paper-deep text-sm font-bold text-mute"
              >
                ·
              </span>
            ) : signedIn ? (
              <div className="relative">
                <details className="group relative">
                  <summary
                    className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-paper-deep [&::-webkit-details-marker]:hidden"
                    aria-label="Account menu"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-herb text-sm font-bold text-paper">
                      cook
                    </span>
                  </summary>
                  <div
                    className="animate-pop absolute right-0 z-50 mt-2 w-56 rounded border border-line bg-card p-1 shadow-lg"
                    role="menu"
                  >
                    <Link
                      href="/profile"
                      onClick={(e) => e.currentTarget.closest("details")?.removeAttribute("open")}
                      role="menuitem"
                      className="block rounded px-3 py-2 text-sm font-bold transition-colors hover:bg-paper-deep"
                    >
                      Profile and badges
                    </Link>
                    <Link
                      href="/settings"
                      onClick={(e) => e.currentTarget.closest("details")?.removeAttribute("open")}
                      role="menuitem"
                      className="block rounded px-3 py-2 text-sm font-bold transition-colors hover:bg-paper-deep"
                    >
                      Account settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        await signOut();
                        router.refresh();
                      }}
                      className="block w-full rounded px-3 py-2 text-left text-sm font-bold text-brake transition-colors hover:bg-paper-deep"
                    >
                      Sign out
                    </button>
                  </div>
                </details>
              </div>
            ) : (
              <Link
                href="/login"
                className="min-h-11 rounded-sm bg-herb px-4 py-2 text-sm font-bold text-paper transition-opacity hover:opacity-90"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
