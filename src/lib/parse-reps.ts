/** Midpoint for ranges like "8-12"; single number as-is; null for AMRAP-style strings. */
export function parseDefaultReps(reps: string | null | undefined): number | null {
  if (!reps) return 10;
  const trimmed = reps.trim();
  const range = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) {
    return Math.round((parseInt(range[1], 10) + parseInt(range[2], 10)) / 2);
  }
  const single = trimmed.match(/^(\d+)$/);
  if (single) return parseInt(single[1], 10);
  return null;
}
