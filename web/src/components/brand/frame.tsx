import { cn } from "@/lib/utils";

const CORNERS = [
  "-top-[5px] -left-[5px]",
  "-top-[5px] -right-[5px]",
  "-bottom-[5px] -left-[5px]",
  "-bottom-[5px] -right-[5px]",
];

function Crosshair({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute text-border-strong", className)}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 0V10M0 5H10" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  );
}

export function Frame({
  children,
  className,
  crosshairs = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { crosshairs?: boolean }) {
  return (
    <div
      className={cn("relative border border-border bg-surface", className)}
      {...props}
    >
      {crosshairs &&
        CORNERS.map((pos) => <Crosshair key={pos} className={pos} />)}
      {children}
    </div>
  );
}

export { Crosshair };
