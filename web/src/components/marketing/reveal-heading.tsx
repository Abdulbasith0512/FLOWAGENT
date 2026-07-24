import { cn } from "@/lib/utils";

export function RevealHeading({
  lines,
  className,
  centered = false,
  serif = false,
  flourishLine,
}: {
  lines: string[];
  className?: string;
  centered?: boolean;
  serif?: boolean;
  flourishLine?: number;
}) {
  let index = 0;
  return (
    <h1
      className={cn(
        serif ? "serif-display" : "font-bold tracking-[-0.035em]",
        className,
      )}
    >
      {lines.map((line, li) => (
        <span key={li} className="block overflow-hidden pb-[0.08em]">
          <span
            className={cn(
              "flex flex-wrap gap-x-[0.25em]",
              centered && "justify-center",
            )}
          >
            {line.split(" ").map((word, wi) => {
              const delay = index++ * 0.06;
              const flourish = li === flourishLine && wi === 0;
              return (
                <span
                  key={`${word}-${delay}`}
                  data-word
                  className={cn(
                    "inline-block animate-[word-rise_0.7s_cubic-bezier(0.2,0.7,0.2,1)_both]",
                    flourish && "accent-flourish",
                  )}
                  style={{ animationDelay: `${delay}s` }}
                >
                  {word}
                  {flourish && <Flourish />}
                </span>
              );
            })}
          </span>
        </span>
      ))}
    </h1>
  );
}

function Flourish() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 12"
      preserveAspectRatio="none"
      fill="none"
      className="accent-flourish-mark animate-[word-rise_0.7s_cubic-bezier(0.2,0.7,0.2,1)_0.5s_both]"
    >
      <path
        d="M2 7 C 22 1, 42 1, 60 6 S 98 11, 118 5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
