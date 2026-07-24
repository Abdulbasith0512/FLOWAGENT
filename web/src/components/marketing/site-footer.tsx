import Link from "next/link";
import { GlobeIcon as Globe } from "@phosphor-icons/react/dist/ssr";

const PLATFORM = [
  { href: "#how", label: "How it works" },
  { href: "#numbers", label: "Numbers" },
  { href: "#approval", label: "Human in the loop" },
  { href: "/app", label: "Open app" },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.5fr_1fr_1fr] md:px-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-fg">
              <span className="h-2 w-2 rounded-[2px] bg-accent-fg" />
            </span>
            <span className="text-sm font-bold tracking-tight">flowagent</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-fg-muted">
            Draw a workflow on a canvas, run it as a live graph, and call it
            from Claude like any other tool.
          </p>
        </div>

        <div>
          <h3 className="kicker">Platform</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {PLATFORM.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  data-cursor
                  className="text-fg-muted transition-colors hover:text-fg"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="kicker">Get in touch</h3>
          <div className="mt-4 flex items-center gap-4 text-fg-muted">
            <Link
              href="https://achal.works"
              data-cursor
              aria-label="Portfolio"
              className="transition-colors hover:text-fg"
            >
              <Globe size={18} />
            </Link>
            <Link
              href="https://github.com/achalbajpai/flowagent"
              data-cursor
              aria-label="GitHub"
              className="transition-colors hover:text-fg"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.56v-2.1c-3.34.71-4.04-1.58-4.04-1.58-.55-1.36-1.34-1.73-1.34-1.73-1.09-.73.08-.72.08-.72 1.2.08 1.83 1.22 1.83 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.34 1.23-3.17-.12-.3-.53-1.52.12-3.16 0 0 1-.32 3.3 1.21a11.5 11.5 0 0 1 6 0c2.29-1.53 3.29-1.21 3.29-1.21.65 1.64.24 2.86.12 3.16.77.83 1.23 1.88 1.23 3.17 0 4.54-2.81 5.53-5.49 5.83.43.37.81 1.1.81 2.22v3.29c0 .31.22.68.83.56A12.02 12.02 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
