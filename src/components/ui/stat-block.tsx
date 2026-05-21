import { cn } from "@/lib/utils";

export function StatBlock({
  icon,
  value,
  label,
  className,
}: {
  icon: string;
  value: string | number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl bg-charcoal-900/80 px-3 py-4 ring-1 ring-charcoal-800",
        className
      )}
    >
      <span className="text-2xl">{icon}</span>
      <span className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-charcoal-50">
        {value}
      </span>
      <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-charcoal-500">
        {label}
      </span>
    </div>
  );
}
