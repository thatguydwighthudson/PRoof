/** Muscle groups included when filtering the library by plan split type. */
export const SPLIT_MUSCLE_GROUPS: Record<string, readonly string[]> = {
  push: ["Chest", "Shoulders", "Triceps"],
  pull: ["Back", "Biceps", "Traps", "Forearms"],
  legs: [
    "Quads",
    "Hamstrings",
    "Glutes",
    "Calves",
    "Adductors",
    "Abductors",
  ],
};

export function muscleGroupsForSplit(
  splitType: string | null | undefined
): readonly string[] | null {
  if (!splitType) return null;
  return SPLIT_MUSCLE_GROUPS[splitType.toLowerCase()] ?? null;
}
