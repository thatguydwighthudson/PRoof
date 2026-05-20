import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sessionExercises,
  sessionSets,
  exercises,
  muscleGroups,
  progressiveOverloadSuggestions,
  num,
} from "@/lib/db/schema";
import {
  LOWER_BODY_REGIONS,
  UPPER_BODY_OVERLOAD_PCT,
  LOWER_BODY_OVERLOAD_PCT,
} from "@/lib/config";
import { kgToLbs, roundToHalf } from "@/lib/units";
import { getPreferredUnit, requireUserId } from "./user";

function isLowerBody(muscleGroupName: string | null | undefined): boolean {
  if (!muscleGroupName) return false;
  return LOWER_BODY_REGIONS.has(muscleGroupName);
}

function roundSuggestedKg(kg: number, unit: "lbs" | "kg"): number {
  if (unit === "lbs") {
    const lbs = kgToLbs(kg);
    const roundedLbs = roundToHalf(lbs);
    return roundedLbs / 2.20462;
  }
  return Math.round(kg * 2) / 2;
}

export async function getPendingSuggestion(exerciseId: number) {
  const userId = await requireUserId();
  const [s] = await db
    .select()
    .from(progressiveOverloadSuggestions)
    .where(
      and(
        eq(progressiveOverloadSuggestions.userId, userId),
        eq(progressiveOverloadSuggestions.exerciseId, exerciseId),
        eq(progressiveOverloadSuggestions.isApplied, false)
      )
    )
    .orderBy(desc(progressiveOverloadSuggestions.createdAt))
    .limit(1);
  return s ?? null;
}

export async function markSuggestionApplied(exerciseId: number) {
  const userId = await requireUserId();
  await db
    .update(progressiveOverloadSuggestions)
    .set({ isApplied: true })
    .where(
      and(
        eq(progressiveOverloadSuggestions.userId, userId),
        eq(progressiveOverloadSuggestions.exerciseId, exerciseId),
        eq(progressiveOverloadSuggestions.isApplied, false)
      )
    );
}

export async function computeOverloadSuggestions(sessionId: number) {
  const userId = await requireUserId();
  const unit = await getPreferredUnit();

  const sessionExList = await db
    .select({
      sessionExercise: sessionExercises,
      exercise: exercises,
      muscleGroup: muscleGroups,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .leftJoin(muscleGroups, eq(exercises.muscleGroupId, muscleGroups.id))
    .where(eq(sessionExercises.sessionId, sessionId));

  for (const { sessionExercise, exercise, muscleGroup } of sessionExList) {
    const sets = await db
      .select()
      .from(sessionSets)
      .where(eq(sessionSets.sessionExerciseId, sessionExercise.id));

    const workingSets = sets.filter((s) => !s.isWarmup);
    if (workingSets.length === 0) continue;

    const allCompleted = workingSets.every((s) => s.isCompleted);
    if (!allCompleted) continue;

    const rpeSets = workingSets.filter((s) => s.rpe != null);
    const avgRpe =
      rpeSets.length > 0
        ? rpeSets.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / rpeSets.length
        : null;

    if (avgRpe != null && avgRpe > 8) continue;

    const weights = workingSets
      .map((s) => num(s.weightKg))
      .filter((w): w is number => w != null && w > 0);
    if (weights.length === 0) continue;

    const maxWeight = Math.max(...weights);
    const pct = isLowerBody(muscleGroup?.name)
      ? LOWER_BODY_OVERLOAD_PCT
      : UPPER_BODY_OVERLOAD_PCT;
    const suggestedKg = roundSuggestedKg(maxWeight * (1 + pct), unit);

    await db
      .insert(progressiveOverloadSuggestions)
      .values({
        userId,
        exerciseId: exercise.id,
        lastWeightKg: String(maxWeight),
        suggestedWeightKg: String(suggestedKg),
        basedOnSessionId: sessionId,
        isApplied: false,
      })
      .onConflictDoNothing();
  }
}
