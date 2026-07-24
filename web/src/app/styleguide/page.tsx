import { Kicker } from "@/components/brand/kicker";
import { Frame } from "@/components/brand/frame";
import { HatchDivider } from "@/components/brand/hatch-divider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const STATUSES = [
  { label: "pending", color: "var(--color-border-strong)" },
  { label: "running", color: "var(--color-run)" },
  { label: "done", color: "var(--color-ok)" },
  { label: "error", color: "var(--color-err)" },
];

export default function StyleguidePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-8 py-16">
      <div className="flex items-center justify-between">
        <div>
          <Kicker>Design System</Kicker>
          <h1 className="mt-2 text-4xl font-medium">FlowAgent</h1>
        </div>
        <ThemeToggle />
      </div>

      <HatchDivider className="my-10" />

      <Kicker>Buttons</Kicker>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="primary">Run workflow</Button>
        <Button variant="secondary">Save</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Delete</Button>
      </div>

      <HatchDivider className="my-10" />

      <Kicker>Frame · Crosshairs</Kicker>
      <Frame className="mt-4 p-6">
        <p className="text-sm text-fg-muted">
          A bordered frame with crosshair corner markers - the blueprint motif
          reused across cards and panels.
        </p>
      </Frame>

      <HatchDivider className="my-10" />

      <Kicker>Node status ring</Kicker>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUSES.map((s) => (
          <Frame
            key={s.label}
            crosshairs={false}
            className="rounded-md p-4"
            style={{ boxShadow: `inset 0 0 0 2px ${s.color}` }}
          >
            <Kicker>{s.label}</Kicker>
            <div className="mt-3 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-sm">LLM node</span>
            </div>
          </Frame>
        ))}
      </div>
    </main>
  );
}
