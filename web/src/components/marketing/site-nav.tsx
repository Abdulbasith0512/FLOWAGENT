"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#numbers", label: "Numbers" },
  { href: "#approval", label: "Human in the loop" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-4 z-50 px-4">
      <nav
        className={cn(
          "mx-auto flex items-center justify-between rounded-full border bg-bg/60 py-2 pl-4 pr-2 backdrop-blur-xl transition-all duration-300",
          scrolled
            ? "max-w-2xl border-border/80 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.3)]"
            : "max-w-3xl border-border/50 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.2)]",
        )}
      >
        <Link href="/" data-cursor className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-fg">
            <span className="h-2 w-2 rounded-[2px] bg-accent-fg" />
          </span>
          <span className="text-sm font-bold tracking-tight">flowagent</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              data-cursor
              className="rounded-full px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/app">
            <Button size="sm" data-cursor className="rounded-full">
              Open app
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
