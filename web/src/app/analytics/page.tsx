export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { getAnalytics } from "@/lib/analytics/actions";
import { Kicker } from "@/components/brand/kicker";
import { Frame } from "@/components/brand/frame";
import { HatchDivider } from "@/components/brand/hatch-divider";

function usd(n: number): string {
  return `$${n.toFixed(4)}`;
}

export default async function AnalyticsPage() {
  await requireUser();
  const { totalRuns, totalCost, perWorkflow } = await getAnalytics();
  const maxCost = Math.max(...perWorkflow.map((w) => w.cost), 0.0001);

  return (
    <main className="mx-auto w-full max-w-3xl px-8 py-16">
      <Kicker>Analytics</Kicker>
      <h1 className="mt-2 text-2xl font-medium tracking-tight">This month</h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Frame className="rounded-md p-5">
          <p className="text-xs text-fg-muted">Total runs</p>
          <p className="mt-1 text-3xl font-medium">{totalRuns}</p>
        </Frame>
        <Frame className="rounded-md p-5">
          <p className="text-xs text-fg-muted">Total cost</p>
          <p className="mt-1 text-3xl font-medium">{usd(totalCost)}</p>
        </Frame>
      </div>

      <HatchDivider className="my-8" />

      <Kicker>Spend per workflow</Kicker>
      <div className="mt-4 space-y-2">
        {perWorkflow.length === 0 ? (
          <p className="text-sm text-fg-muted">No runs yet this month.</p>
        ) : (
          perWorkflow.map((w) => (
            <div key={w.name} className="rounded-md border border-border bg-surface p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{w.name}</span>
                <span className="text-fg-muted">
                  {usd(w.cost)} · {w.runs} runs
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${(w.cost / maxCost) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
