"use client";

import { useEffect, useRef, useState } from "react";

const BRANCHES = [
  { top: "16%", side: "left" as const },
  { top: "38%", side: "right" as const },
  { top: "62%", side: "left" as const },
  { top: "82%", side: "right" as const },
];

export function BlueprintSpine() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el!.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        setProgress(total > 0 ? scrolled / total : 1);
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 hidden md:block"
    >
      <div className="dashed-spine absolute inset-y-0 left-1/2 w-px -translate-x-1/2 opacity-50" />
      <div
        className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-accent/70 transition-[height] duration-150 ease-out"
        style={{ height: `${progress * 100}%` }}
      />
      <span
        className="absolute left-1/2 -translate-x-1/2 transition-[top] duration-150 ease-out"
        style={{ top: `${progress * 100}%` }}
      >
        <span className="block h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_0_4px_var(--accent-tint)]" />
      </span>

      {BRANCHES.map((b, i) => (
        <div
          key={i}
          className="absolute top-0 h-px"
          style={{
            top: b.top,
            left: b.side === "left" ? "8%" : "50%",
            right: b.side === "left" ? "50%" : "8%",
          }}
        >
          <div className="dashed-rail h-px w-full opacity-40" />
        </div>
      ))}
    </div>
  );
}
