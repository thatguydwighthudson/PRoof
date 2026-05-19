import { num } from "@/lib/db/schema";
import { parseDefaultReps } from "@/lib/parse-reps";
import {
  DELOAD_SETS_FACTOR,
  DELOAD_WEIGHT_FACTOR,
} from "@/lib/config";

type PlanExerciseLike = {
  defaultSets: number;
  defaultReps: string;
  defaultWeight: string | null;
};

type LastWeights = {
  maxWeight: number;
  sets: number;
} | null;

type SuggestionLike = {
  suggestedWeightKg: string | number | null;
} | null;

export type ResolvedSetDefaults = {
  setCount: number;
  reps: number | null;
  repsLabel: string;
  weightKg: number | null;
};

export function resolveSetDefaults(
  planExercise: PlanExerciseLike,
  options: {
    deload: boolean;
    last: LastWeights;
    suggestion: SuggestionLike;
  }
): ResolvedSetDefaults {
  const { deload, last, suggestion } = options;
  let setCount = planExercise.defaultSets;
  let weightKg = num(planExercise.defaultWeight);
  const repsLabel = planExercise.defaultReps ?? "8-12";
  let reps = parseDefaultReps(repsLabel);

  if (deload && last) {
    weightKg = last.maxWeight * DELOAD_WEIGHT_FACTOR;
    setCount = Math.max(1, Math.ceil(last.sets * DELOAD_SETS_FACTOR));
  } else if (suggestion) {
    weightKg =
      typeof suggestion.suggestedWeightKg === "number"
        ? suggestion.suggestedWeightKg
        : num(suggestion.suggestedWeightKg);
  } else if (last) {
    weightKg = last.maxWeight;
  }

  return { setCount, reps, repsLabel, weightKg };
}
