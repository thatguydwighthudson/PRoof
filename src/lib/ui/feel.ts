/** Maps 1–5 overall_feel to emojis (values sent to API unchanged) */

export const FEEL_EMOJIS = ["😫", "😕", "😐", "💪", "🔥"] as const;

export function feelEmoji(level: number | null | undefined): string {
  if (level == null || level < 1 || level > 5) return "—";
  return FEEL_EMOJIS[level - 1];
}

export function feelLabel(level: number): string {
  const labels = ["Rough", "Meh", "OK", "Strong", "Crushed it"];
  return labels[level - 1] ?? "";
}
