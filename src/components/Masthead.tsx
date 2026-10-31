"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import Rail from "./Rail";
import { signOut, useProfile, useSession } from "@/lib/auth";
import BrandLogo from "./BrandLogo";

/** PantryPal's pantry-and-jar brand mark. */
const PotMark = ({ className = "size-7" }: { className?: string }) => (
  <BrandLogo className={className} />
);

const NAV = [
  { href: "/", label: "Plan" },
  { href: "/saved", label: "Kitchen" },
  { href: "/community", label: "Community" },
  { href: "/assistant", label: "Chef Pan" },
] as const;

export default function Masthead() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const { profile } = useProfile();
  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;

  const initials = (profile?.display_name ?? "").trim().slice(0, 2).toUpperCase();

  return (
    <>
      <Rail />
      <header className="border-b border-line">
      <div className="mx-auto flex h-auto min-h-16 max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 sm:h-20 sm:flex-nowrap sm:px-8 sm:py-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-herb transition-opacity hover:opacity-80"
        >
          <PotMark />
          <span className="font-display text-2xl font-semibold tracking-tight sm:text-[1.7rem]">
            PantryPal
          </span>
        </Link>
        <nav aria-label="Main" className="ml-auto flex items-center gap-1 sm:gap-2 lg:hidden">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded px-3 py-2 text-sm font-bold transition-colors hover:text-herb ${
                  active ? "text-herb" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <ThemeToggle />
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
                    {profile?.display_name ? initials || "?" : ""}
                  </span>
                </summary>
                <div
                  className="animate-pop absolute right-0 z-50 mt-2 w-56 rounded border border-line bg-card p-2 shadow-lg"
                  role="menu"
                >
                  {profile && (
                    <div className="px-3 py-2">
                      <p className="text-sm font-bold">{profile.display_name}</p>
                      <p className="text-xs text-mute">
                        Level {profile.level} · {profile.xp} xp
                      </p>
                    </div>
                  )}
                  <Link
                    href="/profile"
                    onClick={(e) => e.currentTarget.closest("details")?.removeAttribute("open")}
                    className="block rounded px-3 py-2 text-sm font-bold transition-colors hover:bg-paper-deep"
                  >
                    Profile and badges
                  </Link>
                  <Link
                    href="/settings"
                    onClick={(e) => e.currentTarget.closest("details")?.removeAttribute("open")}
                    className="block rounded px-3 py-2 text-sm font-bold transition-colors hover:bg-paper-deep"
                  >
                    Account settings
                  </Link>
                  <button
                    type="button"
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
              className="rounded-sm bg-herb px-4 py-2 text-sm font-bold text-paper transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
      </header>
    </>
  );
}
