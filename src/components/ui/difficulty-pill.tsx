import { cn } from "@/lib/utils";

export function difficultyPillClass(
  difficulty: string | null | undefined
): string {
  switch (difficulty) {
    case "beginner":
      return "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30";
    case "intermediate":
      return "bg-amber-500/20 text-amber-300 ring-amber-500/30";
    case "advanced":
      return "bg-red-500/20 text-red-300 ring-red-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-400 ring-zinc-500/30";
  }
}

export function DifficultyPill({
  difficulty,
}: {
  difficulty: string | null | undefined;
}) {
  if (!difficulty) return null;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
        difficultyPillClass(difficulty)
      )}
    >
      {difficulty}
    </span>
  );
}
