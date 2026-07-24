"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon as Moon, SunIcon as Sun } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-md border border-border bg-surface text-fg-muted transition-colors hover:border-border-strong hover:text-fg",
        className,
      )}
    >
      <Sun
        size={16}
        weight="duotone"
        className={cn(
          "absolute transition-all duration-300 ease-out",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0",
        )}
      />
      <Moon
        size={16}
        weight="duotone"
        className={cn(
          "absolute transition-all duration-300 ease-out",
          isDark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100",
        )}
      />
    </button>
  );
}
