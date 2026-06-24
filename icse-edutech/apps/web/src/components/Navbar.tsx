"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Flame } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { loadProgress } from "@/lib/progress";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Study", icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(loadProgress().streak.current);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop: sticky header */}
      <header className="hidden sm:flex sticky top-0 z-50 glass border-b border-surface-border h-14 items-center px-6 gap-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-lg font-extrabold text-accent tracking-tight">Crestline</span>
        </Link>
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive(href)
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        {/* Streak pill */}
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-400 tabular-nums">{streak}</span>
          </div>
        )}
      </header>

      {/* Mobile: bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-surface-border safe-bottom">
        <div className="flex items-stretch h-16">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 flex-1 transition-colors duration-200",
                  active ? "text-accent" : "text-muted"
                )}
              >
                <div
                  className={clsx(
                    "w-10 h-7 rounded-lg flex items-center justify-center transition-all duration-200",
                    active ? "bg-accent/15" : ""
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
          {/* Streak tab */}
          {streak > 0 && (
            <div className="flex flex-col items-center justify-center gap-1 flex-none px-4 text-orange-400">
              <div className="w-10 h-7 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tabular-nums">{streak}</span>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
