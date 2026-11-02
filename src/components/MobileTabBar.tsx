"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CookingPot, Notebook, Users, ChefHat, CircleUser } from "lucide-react";

/**
 * The phone bar: five thumb-reach tabs, icons first, always in the same
 * order, the one you are on marked with aria-current and a herb lift.
 * Desktop keeps the left rail, so the bar only lives under lg.
 */
const TABS = [
  { href: "/", label: "Plan", icon: CookingPot },
  { href: "/saved", label: "Kitchen", icon: Notebook },
  { href: "/community", label: "Community", icon: Users },
  { href: "/assistant", label: "Chef Pan", icon: ChefHat },
  { href: "/profile", label: "Profile", icon: CircleUser },
] as const;

export default function MobileTabBar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav
      aria-label="Main"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-bold transition-colors ${
                  active ? "text-herb" : "text-ink-soft hover:text-herb"
                }`}
              >
                <Icon
                  className="size-6"
                  strokeWidth={active ? 2.4 : 2}
                  aria-hidden="true"
                />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
