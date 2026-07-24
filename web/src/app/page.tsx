import {
  PenNibIcon as PenNib,
  PulseIcon as Pulse,
  PlugIcon as Plug,
} from "@phosphor-icons/react/dist/ssr";
import { Kicker } from "@/components/brand/kicker";
import { Cursor } from "@/components/marketing/cursor";
import { RevealHeading } from "@/components/marketing/reveal-heading";
import { NodeMarquee } from "@/components/marketing/node-marquee";
import { FeatureCell } from "@/components/marketing/feature-cell";
import { ApprovalVisual } from "@/components/marketing/approval-visual";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { Reveal } from "@/components/marketing/reveal";
import { RevealText } from "@/components/marketing/reveal-text";
import { BlueprintSpine } from "@/components/marketing/blueprint-spine";
import { StatBand } from "@/components/marketing/stat-band";
import { UseCases } from "@/components/marketing/use-cases";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CtaButton } from "@/components/marketing/cta-button";
import { getSession } from "@/lib/session";

const STEPS = [
  {
    n: "01",
    title: "Draw the graph",
    body: "Drop nodes on the canvas and connect them. What you draw is what executes. There is no DSL to learn.",
    icon: PenNib,
  },
  {
    n: "02",
    title: "Run it live",
    body: "Hit run and each node lights up as execution moves through it, streamed straight from the engine.",
    live: true,
    icon: Pulse,
  },
  {
    n: "03",
    title: "Call it from Claude",
    body: "Every workflow is registered as a tool, so your assistant can trigger it by name from a prompt.",
    icon: Plug,
  },
];

export default async function Home() {
  const session = await getSession();
  const startHref = session?.user ? "/app" : "/signup";

  return (
    <main className="relative min-h-screen bg-bg">
      <Cursor />

      <div aria-hidden className="dot-bg pointer-events-none absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
        style={{
          background:
            "radial-gradient(80% 60% at 30% 0%, var(--color-accent-tint) 0%, transparent 60%)",
          opacity: 0.5,
        }}
      />

      <SiteNav />

      <div className="relative">
        <BlueprintSpine />

        <div className="relative z-10">
          <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-24 text-center md:pt-32">
            <RevealHeading
              centered
              serif
              flourishLine={0}
              className="mt-5 text-6xl md:text-[6.5rem]"
              lines={["Wire up an agent.", "Then watch it think."]}
            />
            <p className="mt-7 max-w-xl text-lg text-fg-muted">
              Ship an AI workflow in minutes, not a sprint. Draw it on a canvas,
              watch it run live, and call it from Claude like any other tool.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <CtaButton href={startHref}>Start building</CtaButton>
              <CtaButton href="#how" variant="secondary">
                See how it works
              </CtaButton>
            </div>
          </section>

          <section className="mx-auto w-full max-w-6xl px-6 pt-14 md:px-10">
            <HeroDemo />
          </section>

          <div className="mx-auto mt-24 w-full max-w-6xl px-6 md:px-10">
            <Reveal className="mb-5 text-center">
              <Kicker>Seven node types, one canvas</Kicker>
            </Reveal>
            <NodeMarquee />
          </div>

          <section
            id="numbers"
            className="mx-auto mt-28 w-full max-w-6xl scroll-mt-24 px-6 md:px-10"
          >
            <Reveal>
              <div className="mb-10 max-w-2xl">
                <Kicker>By the numbers</Kicker>
                <RevealText
                  text="Everything the graph gives you."
                  className="mt-3 text-4xl md:text-5xl"
                />
              </div>
            </Reveal>
            <StatBand />
          </section>

          <section
            id="use-cases"
            className="mx-auto mt-28 w-full max-w-6xl scroll-mt-24 px-6 md:px-10"
          >
            <Reveal>
              <div className="mb-10 max-w-2xl">
                <Kicker>What you can build</Kicker>
                <RevealText
                  text="Real workflows, drawn in minutes."
                  className="mt-3 text-4xl md:text-5xl"
                />
              </div>
            </Reveal>
            <UseCases />
          </section>

          <section
            id="how"
            className="mx-auto mt-28 w-full max-w-6xl scroll-mt-24 px-6 md:px-10"
          >
            <Reveal>
              <div className="mb-10 max-w-2xl">
                <Kicker>How it works</Kicker>
                <RevealText
                  text="Three steps, no glue code."
                  className="mt-3 text-4xl md:text-5xl"
                />
              </div>
            </Reveal>
            <Reveal>
              <div className="grid overflow-hidden rounded-2xl border border-border md:grid-cols-3">
                {STEPS.map((s, i) => (
                  <div
                    key={s.n}
                    className={i < STEPS.length - 1 ? "border-b border-border md:border-b-0 md:border-r" : ""}
                  >
                    <FeatureCell n={s.n} title={s.title} body={s.body} live={s.live} icon={s.icon} />
                  </div>
                ))}
              </div>
            </Reveal>
          </section>

          <section
            id="approval"
            className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-28 md:px-10"
          >
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-10 md:p-16">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-50"
                  style={{
                    background:
                      "radial-gradient(60% 80% at 85% 50%, var(--color-accent-tint) 0%, transparent 60%)",
                  }}
                />
                <div className="relative grid items-center gap-10 md:grid-cols-2">
                  <div>
                    <Kicker>Human in the loop</Kicker>
                    <RevealText
                      text="Pause for a human, then pick up where it stopped."
                      className="mt-4 text-4xl md:text-5xl"
                    />
                    <p className="mt-5 max-w-md text-fg-muted">
                      Drop in an approval step and the run stops, emails whoever
                      needs to sign off, and resumes from the exact checkpoint when
                      they click. The state survives restarts.
                    </p>
                  </div>
                  <ApprovalVisual />
                </div>
              </div>
            </Reveal>
          </section>

          <section className="mx-auto w-full max-w-6xl px-6 py-28 md:px-10">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-20 text-center md:py-28">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-60"
                  style={{
                    background:
                      "radial-gradient(60% 100% at 50% 0%, var(--color-accent-tint) 0%, transparent 60%)",
                  }}
                />
                <div
                  aria-hidden
                  className="dashed-spine pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 opacity-40"
                />
                <div className="relative flex flex-col items-center gap-7">
                  <h2 className="serif-display max-w-2xl text-balance text-5xl md:text-7xl">
                    Open the canvas and build something.
                  </h2>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <CtaButton href={startHref}>Start building</CtaButton>
                    <CtaButton href="/app" variant="secondary">
                      Open app
                    </CtaButton>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}
