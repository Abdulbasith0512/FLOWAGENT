"use client";

import { useEffect, useRef } from "react";
import { PlayIcon as Play } from "@phosphor-icons/react";

export function AppWindow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el!.getBoundingClientRect();
        const progress = Math.min(
          Math.max((window.innerHeight - rect.top) / window.innerHeight, 0),
          1,
        );
        const tilt = (1 - progress) * 7;
        el!.style.transform = `perspective(1600px) rotateX(${tilt.toFixed(2)}deg)`;
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
      className="origin-top overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_40px_100px_-35px_rgba(0,0,0,0.4)] transition-transform duration-100 will-change-transform"
    >
      <div className="flex items-center gap-3 border-b border-border bg-surface-2/60 px-4 py-3">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-border-strong" />
          <span className="h-3 w-3 rounded-full bg-border-strong" />
          <span className="h-3 w-3 rounded-full bg-border-strong" />
        </div>
        <div className="ml-2 flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" />
          <span className="font-mono text-xs text-fg-muted">research-summary</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-fg">
            <Play size={11} weight="fill" />
            Run
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
