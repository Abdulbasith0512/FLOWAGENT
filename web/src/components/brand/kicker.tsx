import { cn } from "@/lib/utils";

export function Kicker({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("kicker inline-flex items-center gap-2", className)}>
      <span aria-hidden className="h-px w-5 bg-accent" />
      {children}
    </span>
  );
}
