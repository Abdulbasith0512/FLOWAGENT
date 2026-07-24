import { Kicker } from "@/components/brand/kicker";

interface Props {
  state: Record<string, unknown>;
  title?: string;
}

export function VariableExplorer({ state, title = "State" }: Props) {
  const entries = Object.entries(state);

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <Kicker>{title}</Kicker>
      </div>
      {entries.length === 0 ? (
        <p className="px-4 py-3 text-sm text-fg-muted">No variables yet.</p>
      ) : (
        <dl className="divide-y divide-border">
          {entries.map(([key, value]) => (
            <div key={key} className="px-4 py-3">
              <dt className="mb-1 font-mono text-xs text-accent">{key}</dt>
              <dd>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs tabular-nums text-fg">
                  {format(value)}
                </pre>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function format(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
