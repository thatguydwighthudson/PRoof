type SetLike = { isWarmup: boolean; isCompleted: boolean };

export type ExerciseProgressStatus = "none" | "partial" | "done";

export function getExerciseProgress(sets: SetLike[]): ExerciseProgressStatus {
  const working = sets.filter((s) => !s.isWarmup);
  if (working.length === 0) return "none";
  const done = working.filter((s) => s.isCompleted).length;
  if (done === 0) return "none";
  if (done >= working.length) return "done";
  return "partial";
}

export function progressLabel(status: ExerciseProgressStatus): string {
  if (status === "done") return "✓";
  if (status === "partial") return "◐";
  return "";
}
