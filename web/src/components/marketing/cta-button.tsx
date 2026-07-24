"use client";

import Link from "next/link";
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react";
import { Magnetic } from "@/components/marketing/magnetic";
import { cn } from "@/lib/utils";

export function CtaButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Magnetic>
      <Link
        href={href}
        data-cursor
        className={cn(
          "group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full px-7 text-sm font-medium transition-transform hover:-translate-y-0.5 active:scale-[0.98]",
          variant === "primary"
            ? "cta-glow text-accent-fg hover:cta-glow-hover"
            : "border border-border-strong bg-surface text-fg hover:bg-surface-2",
          className,
        )}
      >
        {variant === "primary" && (
          <span
            aria-hidden
            className="shine-streak group-hover:animate-[shine-sweep_0.7s_ease-out]"
          />
        )}
        <span className="relative inline-flex items-center gap-2">
          {children}
          <ArrowRight
            size={16}
            weight="bold"
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </span>
      </Link>
    </Magnetic>
  );
}
