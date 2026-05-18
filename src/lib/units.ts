import { LBS_PER_KG } from "./config";

export type PreferredUnit = "lbs" | "kg";

export function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}

export function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}

/** Round to nearest 0.5 for display in lbs */
export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/** Round to nearest 0.5 kg */
export function roundToHalfKg(value: number): number {
  return Math.round(value * 2) / 2;
}

export function displayWeight(
  weightKg: number | null | undefined,
  unit: PreferredUnit
): string {
  if (weightKg == null) return "—";
  if (unit === "lbs") {
    return `${roundToHalf(kgToLbs(weightKg))} lbs`;
  }
  return `${roundToHalfKg(weightKg)} kg`;
}

export function displayWeightValue(
  weightKg: number | null | undefined,
  unit: PreferredUnit
): number | null {
  if (weightKg == null) return null;
  if (unit === "lbs") return roundToHalf(kgToLbs(weightKg));
  return roundToHalfKg(weightKg);
}

export function inputToKg(value: number, unit: PreferredUnit): number {
  if (unit === "lbs") return lbsToKg(value);
  return value;
}

export function formatWeightShort(
  weightKg: number,
  unit: PreferredUnit
): string {
  const v = displayWeightValue(weightKg, unit);
  return unit === "lbs" ? `${v} lbs` : `${v} kg`;
}
