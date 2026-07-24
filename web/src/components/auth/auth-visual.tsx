import Link from "next/link";
import { HeroCanvas } from "@/components/marketing/hero-canvas";

export function AuthVisual() {
  return (
    <div className="relative hidden overflow-hidden border-r border-border bg-surface lg:block">
      <div aria-hidden className="dot-bg pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 80% at 15% 0%, var(--color-accent-tint) 0%, transparent 55%)",
          opacity: 0.5,
        }}
      />

      <div className="relative flex h-full flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-fg">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-accent-fg" />
          </span>
          <span className="text-base font-bold tracking-tight">flowagent</span>
        </Link>

        <div className="overflow-hidden rounded-xl border border-border bg-bg shadow-[0_40px_100px_-35px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            <span className="ml-2 font-mono text-[11px] text-fg-muted">research-summary</span>
          </div>
          <div className="h-72">
            <HeroCanvas />
          </div>
        </div>

        <div>
          <p className="serif-display max-w-sm text-3xl">
            Wire up an agent.
            <br />
            <span className="text-fg-muted">Then watch it think.</span>
          </p>
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
            {["Live execution", "Human in the loop", "Callable from Claude"].map(
              (point) => (
                <li key={point} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {point}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
