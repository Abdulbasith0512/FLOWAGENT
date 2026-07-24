import {
  MagnifyingGlassIcon as MagnifyingGlass,
  RobotIcon as Robot,
  UserCheckIcon as UserCheck,
  EnvelopeIcon as Envelope,
  GlobeIcon as Globe,
  CodeIcon as Code,
  GitBranchIcon as GitBranch,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/marketing/reveal";
import { SpotlightCard } from "@/components/marketing/spotlight-card";

const CASES = [
  {
    title: "Research summary",
    body: "Search the web, summarize with an LLM, get a human sign-off, then email the brief.",
    chips: [
      { icon: MagnifyingGlass, label: "Search" },
      { icon: Robot, label: "LLM" },
      { icon: UserCheck, label: "Approve" },
      { icon: Envelope, label: "Email" },
    ],
  },
  {
    title: "Lead enrichment",
    body: "Hit an API for each lead, branch on company size, and write the result back.",
    chips: [
      { icon: Globe, label: "HTTP" },
      { icon: GitBranch, label: "Branch" },
      { icon: Robot, label: "LLM" },
      { icon: Code, label: "Code" },
    ],
  },
  {
    title: "Support triage",
    body: "Classify an incoming message, route by intent, and draft a reply for review.",
    chips: [
      { icon: Robot, label: "LLM" },
      { icon: GitBranch, label: "Branch" },
      { icon: UserCheck, label: "Approve" },
      { icon: Envelope, label: "Reply" },
    ],
  },
];

export function UseCases() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {CASES.map((c, i) => (
        <Reveal key={c.title} delay={i * 80}>
          <SpotlightCard
            className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.35)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              {c.chips.map(({ icon: Icon, label }, ci) => (
                <span key={label} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-bg text-accent transition-all duration-300 group-hover:border-accent/40 group-hover:bg-accent-tint">
                    <Icon
                      size={14}
                      weight="duotone"
                      className="transition-transform duration-300 group-hover:scale-110"
                    />
                  </span>
                  {ci < c.chips.length - 1 && (
                    <span className="h-px w-3 bg-border-strong" aria-hidden />
                  )}
                </span>
              ))}
            </div>
            <h3 className="mt-6 text-lg font-medium tracking-tight">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{c.body}</p>
            <span className="mt-4 inline-flex w-fit items-center gap-1.5 font-mono text-xs text-fg-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              {c.chips.length} nodes
            </span>
          </SpotlightCard>
        </Reveal>
      ))}
    </div>
  );
}
