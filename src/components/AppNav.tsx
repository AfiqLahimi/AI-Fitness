"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Gauge, LineChart, LogOut, MessageCircle, Salad, UserRound, Library, Film } from "lucide-react";
import { Logo, cx } from "./ui";
import { logoutAction } from "@/lib/server/actions";

const NAV = [
  { href: "/app", label: "Today", icon: Gauge },
  { href: "/app/plan", label: "Plan", icon: CalendarDays },
  { href: "/app/nutrition", label: "Nutrition", icon: Salad },
  { href: "/app/progress", label: "Progress", icon: LineChart },
  { href: "/app/coach", label: "Coach", icon: MessageCircle },
];

export function AppNav({ name }: { name: string }) {
  const path = usePathname();
  const active = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-ink/80 px-4 py-6 backdrop-blur lg:flex">
        <Link href="/app" className="px-2"><Logo /></Link>
        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active(href) ? "bg-white/[0.06] text-fg" : "text-dim hover:bg-white/[0.03] hover:text-fg")}>
              <Icon className={cx("h-[18px] w-[18px]", active(href) && "text-lime")} />{label}
            </Link>
          ))}
          <Link href="/library" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-dim transition hover:bg-white/[0.03] hover:text-fg"><Library className="h-[18px] w-[18px]" />Exercise library</Link>
          <Link href="/app/videos" className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active("/app/videos") ? "bg-white/[0.06] text-fg" : "text-dim hover:bg-white/[0.03] hover:text-fg")}><Film className={cx("h-[18px] w-[18px]", active("/app/videos") && "text-lime")} />Video library</Link>
        </nav>
        <div className="mt-auto space-y-1">
          <Link href="/app/profile" className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition", active("/app/profile") ? "bg-white/[0.06] text-fg" : "text-dim hover:text-fg")}>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-lime/15 text-xs font-bold text-lime">{name.slice(0, 1).toUpperCase()}</span>
            <span className="truncate">{name}</span>
          </Link>
          <form action={logoutAction}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-mute transition hover:text-fg"><LogOut className="h-4 w-4" /> Sign out</button></form>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-base/80 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/app"><Logo /></Link>
        <Link href="/app/profile" aria-label="Profile" className="grid h-9 w-9 place-items-center rounded-full bg-white/5"><UserRound className="h-4 w-4" /></Link>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cx("flex flex-col items-center gap-1 py-2.5 text-[11px]", active(href) ? "text-lime" : "text-mute")}>
              <Icon className="h-5 w-5" />{label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
