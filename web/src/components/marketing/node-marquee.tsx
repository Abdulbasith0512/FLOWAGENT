import {
  RobotIcon as Robot,
  MagnifyingGlassIcon as MagnifyingGlass,
  CodeIcon as Code,
  GlobeIcon as Globe,
  EnvelopeIcon as Envelope,
  GitBranchIcon as GitBranch,
  UserCheckIcon as UserCheck,
} from "@phosphor-icons/react/dist/ssr";

const NODES = [
  { icon: MagnifyingGlass, label: "Search" },
  { icon: Robot, label: "LLM" },
  { icon: Code, label: "Code" },
  { icon: Globe, label: "HTTP" },
  { icon: Envelope, label: "Email" },
  { icon: GitBranch, label: "Condition" },
  { icon: UserCheck, label: "Human approve" },
];

export function NodeMarquee() {
  const row = [...NODES, ...NODES];
  return (
    <div className="group relative overflow-hidden border-y border-border py-5">
      <div
        className="flex w-max gap-3 animate-[marquee_28s_linear_infinite] group-hover:[animation-play-state:paused]"
        style={{ willChange: "transform" }}
      >
        {row.map(({ icon: Icon, label }, i) => (
          <div
            key={`${label}-${i}`}
            data-cursor
            className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm transition-colors hover:border-accent/40"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-tint text-accent">
              <Icon size={15} weight="duotone" />
            </span>
            {label}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-bg to-transparent" />
    </div>
  );
}
