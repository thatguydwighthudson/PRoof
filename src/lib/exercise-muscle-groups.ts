export const MUSCLE_ORDER = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Traps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Adductors",
  "Abductors",
  "Abs",
  "Obliques",
  "Lower Back",
  "Full Body",
] as const;

export const MUSCLE_DOT: Record<string, string> = {
  Chest: "bg-red-400",
  Back: "bg-blue-400",
  Shoulders: "bg-violet-400",
  Biceps: "bg-pink-400",
  Triceps: "bg-orange-400",
  Forearms: "bg-zinc-400",
  Traps: "bg-slate-400",
  Quads: "bg-emerald-400",
  Hamstrings: "bg-lime-400",
  Glutes: "bg-fuchsia-400",
  Calves: "bg-cyan-400",
  Adductors: "bg-teal-400",
  Abductors: "bg-sky-400",
  Abs: "bg-amber-400",
  Obliques: "bg-yellow-400",
  "Lower Back": "bg-orange-300",
  "Full Body": "bg-zinc-300",
};

export function sortMuscleGroupNames(names: string[]): string[] {
  const known = MUSCLE_ORDER.filter((g) => names.includes(g));
  const rest = names
    .filter((g) => !MUSCLE_ORDER.includes(g as (typeof MUSCLE_ORDER)[number]))
    .sort();
  return [...known, ...rest];
}

export function groupByMuscleGroup<T extends { muscleGroupName: string | null }>(
  items: T[]
): { group: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const g = item.muscleGroupName ?? "Other";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(item);
  }
  return sortMuscleGroupNames([...map.keys()]).map((group) => ({
    group,
    items: (map.get(group) ?? []).sort((a, b) => {
      const an = "name" in a && typeof a.name === "string" ? a.name : "";
      const bn = "name" in b && typeof b.name === "string" ? b.name : "";
      return an.localeCompare(bn);
    }),
  }));
}
