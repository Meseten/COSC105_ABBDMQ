"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChefHat,
  ClipboardList,
  Heart,
  MessagesSquare,
  NotebookPen,
  ShoppingCart,
  CircleHelp,
  Settings,
  Users,
} from "lucide-react";

const GROUPS: {
  heading: string;
  items: { href: string; label: string; Icon: typeof ChefHat }[];
}[] = [
  {
    heading: "Cook",
    items: [
      { href: "/", label: "Plan", Icon: NotebookPen },
      { href: "/saved", label: "Kitchen", Icon: ChefHat },
      { href: "/groceries", label: "Groceries", Icon: ShoppingCart },
    ],
  },
  {
    heading: "Recipes",
    items: [
      { href: "/recipes", label: "My Recipes", Icon: ClipboardList },
      { href: "/recipes?favorites=1", label: "Favorites", Icon: Heart },
    ],
  },
  {
    heading: "Together",
    items: [
      { href: "/community", label: "Community", Icon: Users },
      { href: "/assistant", label: "Chef Pan", Icon: MessagesSquare },
    ],
  },
  {
    heading: "You",
    items: [
      { href: "/help", label: "Help & Feedback", Icon: CircleHelp },
      { href: "/settings", label: "Settings", Icon: Settings },
    ],
  },
];

export default function Rail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections"
      className="fixed top-[73px] bottom-0 left-0 z-30 hidden w-60 flex-col overflow-y-auto border-r border-line bg-paper px-3 py-5 lg:flex"
    >
      {GROUPS.map((group) => (
        <div key={group.heading} className="mb-4">
          <p className="px-3 pb-1 text-[11px] font-bold tracking-widest text-mute uppercase">
            {group.heading}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ href, label, Icon }) => {
              const base = href.split("?")[0];
              const active = href === "/" ? pathname === "/" : base === pathname;
              return (
                <li key={label}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-bold transition-colors ${
                      active
                        ? "bg-herb/15 text-herb"
                        : "text-ink-soft hover:bg-paper-deep hover:text-ink"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="mt-auto px-3 text-xs text-mute">
        Cooked with what you have.
      </div>
    </nav>
  );
}
