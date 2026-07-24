import type { Icon } from "@phosphor-icons/react";

export function FeatureCell({
  n,
  title,
  body,
  live,
  icon: Icon,
}: {
  n: string;
  title: string;
  body: string;
  live?: boolean;
  icon?: Icon;
}) {
  return (
    <div
      data-cursor
      className="group relative bg-bg p-7 transition-colors hover:bg-surface"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="ants-border absolute inset-0" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-accent">{n}</span>
          {live && (
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent [animation:live-pulse_1.8s_ease-out_infinite]" />
          )}
        </div>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-accent transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-accent/40 group-hover:bg-accent-tint">
            <Icon
              size={18}
              weight="duotone"
              className="transition-transform duration-300 group-hover:scale-110"
            />
          </span>
        )}
      </div>
      <h3 className="mt-5 text-lg font-medium tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}
