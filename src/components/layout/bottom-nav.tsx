"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/today", label: "Today", emoji: "🏋️" },
  { href: "/history", label: "History", emoji: "📅" },
  { href: "/exercises", label: "Exercises", emoji: "💪" },
  { href: "/chat", label: "AI Chat", emoji: "🤖" },
];

export function BottomNav() {
  const pathname = usePathname();
  const hide =
    pathname.startsWith("/workout/") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/body");

  if (hide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/80 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {links.map(({ href, label, emoji }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors",
                active ? "text-emerald-400" : "text-zinc-500"
              )}
            >
              {active && (
                <span className="absolute top-1 h-1 w-8 rounded-full bg-emerald-500" />
              )}
              <span className="text-xl leading-none">{emoji}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
