"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export function SpotlightCard({
  children,
  className,
  tone = "var(--color-accent)",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      data-cursor
      className={cn("group/spot relative overflow-hidden", className)}
      style={{ "--spot-tone": tone } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(220px circle at var(--mx) var(--my), color-mix(in oklch, var(--spot-tone) 16%, transparent), transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
