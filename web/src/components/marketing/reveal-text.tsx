"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function RevealText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <h2 ref={ref} className={cn("serif-display", className)}>
      <span className="flex flex-wrap gap-x-[0.25em] overflow-hidden">
        {text.split(" ").map((word, i) => (
          <span
            key={`${word}-${i}`}
            className={cn(
              "inline-block transition-all duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none",
              shown
                ? "translate-y-0 opacity-100"
                : "translate-y-[0.6em] opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
            )}
            style={{ transitionDelay: shown ? `${i * 55}ms` : "0ms" }}
          >
            {word}
          </span>
        ))}
      </span>
    </h2>
  );
}
