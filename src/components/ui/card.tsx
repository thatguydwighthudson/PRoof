import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-charcoal-800/80 bg-charcoal-900/60 p-4 shadow-lg backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
