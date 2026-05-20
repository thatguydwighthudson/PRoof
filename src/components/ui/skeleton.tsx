import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-zinc-800/80 ring-1 ring-zinc-800/50",
        className
      )}
      {...props}
    />
  );
}
