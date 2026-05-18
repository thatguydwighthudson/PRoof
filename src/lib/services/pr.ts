import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sessionExercises,
  sessionSets,
  personalRecords,
  num,
} from "@/lib/db/schema";
import { CURRENT_USER_ID } from "@/lib/config";

export type PrCheckResult = {
  isWeightPr: boolean;
  isRepsPr: boolean;
  isVolumePr: boolean;
};

export async function getPersonalRecord(exerciseId: number) {
  const [pr] = await db
    .select()
    .from(personalRecords)
    .where(
      and(
        eq(personalRecords.userId, CURRENT_USER_ID),
        eq(personalRecords.exerciseId, exerciseId)
      )
    )
    .limit(1);
  return pr ?? null;
}

export function checkSetForPr(
  weightKg: number | null,
  reps: number | null,
  pr: {
    bestWeightKg: string | null;
    bestWeightReps: number | null;
    bestReps: number | null;
    bestVolumeKg: string | null;
  } | null
): PrCheckResult {
  if (!weightKg || !reps) {
    return { isWeightPr: false, isRepsPr: false, isVolumePr: false };
  }

  const volume = weightKg * reps;
  const bestWeight = pr ? num(pr.bestWeightKg) : null;
  const bestReps = pr?.bestReps ?? null;
  const bestVolume = pr ? num(pr.bestVolumeKg) : null;

  const isWeightPr =
    bestWeight == null ||
    weightKg > bestWeight ||
    (weightKg === bestWeight && reps > (pr?.bestWeightReps ?? 0));

  const isRepsPr = bestReps == null || reps > bestReps;
  const isVolumePr = bestVolume == null || volume > bestVolume;

  return { isWeightPr, isRepsPr, isVolumePr };
}

export async function updatePersonalRecords(sessionId: number) {
  const sessionExList = await db
    .select()
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId));

  for (const se of sessionExList) {
    const sets = await db
      .select()
      .from(sessionSets)
      .where(
        and(
          eq(sessionSets.sessionExerciseId, se.id),
          eq(sessionSets.isWarmup, false),
          eq(sessionSets.isCompleted, true)
        )
      );

    let bestWeight = 0;
    let bestWeightReps = 0;
    let bestReps = 0;
    let bestVolume = 0;

    for (const set of sets) {
      const w = num(set.weightKg) ?? 0;
      const r = set.reps ?? 0;
      const vol = w * r;
      if (w > bestWeight || (w === bestWeight && r > bestWeightReps)) {
        bestWeight = w;
        bestWeightReps = r;
      }
      if (r > bestReps) bestReps = r;
      if (vol > bestVolume) bestVolume = vol;
    }

    if (bestWeight === 0 && bestReps === 0) continue;

    const existing = await getPersonalRecord(se.exerciseId);

    const updates: Partial<typeof personalRecords.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (
      !existing ||
      bestWeight > (num(existing.bestWeightKg) ?? 0) ||
      (bestWeight === (num(existing.bestWeightKg) ?? 0) &&
        bestWeightReps > (existing.bestWeightReps ?? 0))
    ) {
      updates.bestWeightKg = String(bestWeight);
      updates.bestWeightReps = bestWeightReps;
      updates.bestWeightSessionId = sessionId;
    }

    if (!existing || bestReps > (existing.bestReps ?? 0)) {
      updates.bestReps = bestReps;
      updates.bestRepsSessionId = sessionId;
    }

    if (!existing || bestVolume > (num(existing.bestVolumeKg) ?? 0)) {
      updates.bestVolumeKg = String(bestVolume);
      updates.bestVolumeSessionId = sessionId;
    }

    if (existing) {
      await db
        .update(personalRecords)
        .set(updates)
        .where(eq(personalRecords.id, existing.id));
    } else {
      await db.insert(personalRecords).values({
        userId: CURRENT_USER_ID,
        exerciseId: se.exerciseId,
        bestWeightKg: bestWeight > 0 ? String(bestWeight) : null,
        bestWeightReps: bestWeight > 0 ? bestWeightReps : null,
        bestReps: bestReps > 0 ? bestReps : null,
        bestVolumeKg: bestVolume > 0 ? String(bestVolume) : null,
        bestWeightSessionId: bestWeight > 0 ? sessionId : null,
        bestRepsSessionId: bestReps > 0 ? sessionId : null,
        bestVolumeSessionId: bestVolume > 0 ? sessionId : null,
      });
    }
  }
}
