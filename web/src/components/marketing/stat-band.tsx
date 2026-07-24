import { Reveal } from "@/components/marketing/reveal";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { CountUp } from "@/components/marketing/count-up";

const STATS = [
  {
    num: 7,
    label: "node types",
    sub: [
      { n: "LLM", t: "search, code" },
      { n: "HTTP", t: "email, branch" },
    ],
    featured: true,
  },
  {
    num: 0,
    label: "lines of glue code",
    sub: [
      { n: "drag", t: "to add a node" },
      { n: "wire", t: "to connect" },
    ],
  },
  {
    text: "live",
    label: "execution streaming",
    sub: [
      { n: "resume", t: "from checkpoint" },
      { n: "survive", t: "restarts" },
    ],
  },
  {
    num: 1,
    label: "tool call from Claude",
    sub: [
      { n: "MCP", t: "auto-registered" },
      { n: "name", t: "to trigger" },
    ],
  },
];

export function StatBand() {
  return (
    <Reveal>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <SpotlightCard
            key={s.label}
            tone={s.featured ? "var(--color-bg)" : "var(--color-accent)"}
            className={[
              "group flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300",
              s.featured
                ? "border-transparent bg-fg text-bg shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]"
                : "border-border bg-surface hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.35)]",
            ].join(" ")}
          >
            <div className="mb-12">
              <span
                className={[
                  "serif-display block text-6xl",
                  s.featured ? "text-bg" : "text-fg",
                ].join(" ")}
              >
                {typeof s.num === "number" ? <CountUp to={s.num} /> : s.text}
              </span>
              <span
                className={[
                  "mt-2 block text-sm",
                  s.featured ? "text-bg/70" : "text-fg-muted",
                ].join(" ")}
              >
                {s.label}
              </span>
            </div>
            <div
              className={[
                "grid grid-cols-2 gap-3 border-t pt-4 text-xs",
                s.featured ? "border-bg/15" : "border-border",
              ].join(" ")}
            >
              {s.sub.map((item) => (
                <div key={item.n}>
                  <div className="font-mono font-medium">{item.n}</div>
                  <div className={s.featured ? "text-bg/55" : "text-fg-muted"}>
                    {item.t}
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>
        ))}
      </div>
    </Reveal>
  );
}
