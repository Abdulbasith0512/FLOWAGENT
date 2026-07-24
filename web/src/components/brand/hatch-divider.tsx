import { cn } from "@/lib/utils";

export function HatchDivider({
  className,
  height = 18,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <div
      aria-hidden
      style={{ height }}
      className={cn("hatch w-full border-y border-border", className)}
    />
  );
}
