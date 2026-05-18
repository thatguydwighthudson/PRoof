import { and, asc, desc, eq, isNull, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  workoutSessions,
  sessionExercises,
  sessionSets,
  sessionExerciseSwaps,
  workoutPlanExercises,
  planExerciseVariations,
  workoutPlans,
  exercises,
  muscleGroups,
  num,
} from "@/lib/db/schema";
import {
  CURRENT_USER_ID,
  DELOAD_SETS_FACTOR,
  DELOAD_WEIGHT_FACTOR,
} from "@/lib/config";
import { getTodayPlan, advanceProgramDay } from "./program";
import { getPendingSuggestion, markSuggestionApplied, computeOverloadSuggestions } from "./overload";
import { updatePersonalRecords } from "./pr";
import { getPreferredUnit } from "./user";
import { parseDefaultReps } from "@/lib/parse-reps";

export const USER_ADDED_MARKER = "__user_added__";

export async function getActiveSessionOrNull() {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, CURRENT_USER_ID),
        isNull(workoutSessions.endedAt)
      )
    )
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);

  return session ?? null;
}

async function getLastSessionWeights(exerciseId: number) {
  const recentSessions = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, CURRENT_USER_ID),
        eq(workoutSessions.isDeload, false)
      )
    )
    .orderBy(desc(workoutSessions.sessionDate))
    .limit(10);

  for (const sess of recentSessions) {
    const [se] = await db
      .select({ id: sessionExercises.id })
      .from(sessionExercises)
      .where(
        and(
          eq(sessionExercises.sessionId, sess.id),
          eq(sessionExercises.exerciseId, exerciseId)
        )
      )
      .limit(1);

    if (!se) continue;

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

    const weights = sets
      .map((s) => num(s.weightKg))
      .filter((w): w is number => w != null);
    if (weights.length > 0) {
      return {
        maxWeight: Math.max(...weights),
        sets: sets.length,
        lastSets: sets,
      };
    }
  }
  return null;
}

export async function startSession(planId?: number) {
  const existing = await getActiveSessionOrNull();
  if (existing) return getSessionDetail(existing.id);

  const today = await getTodayPlan();
  if (!today?.plan) throw new Error("No workout plan for today");

  const pid = planId ?? today.plan.id;
  const deload = today.deload;

  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId: CURRENT_USER_ID,
      planId: pid,
      startedAt: new Date(),
      isDeload: deload,
    })
    .returning();

  let exercisesToAdd = today.exercises;
  if (planId && planId !== today.plan.id) {
    const raw = await db
      .select({
        planExercise: workoutPlanExercises,
        exercise: exercises,
      })
      .from(workoutPlanExercises)
      .innerJoin(exercises, eq(workoutPlanExercises.exerciseId, exercises.id))
      .where(eq(workoutPlanExercises.planId, pid))
      .orderBy(workoutPlanExercises.sortOrder);
    exercisesToAdd = raw.map((r) => ({
      planExercise: r.planExercise,
      exercise: r.exercise,
      muscleGroup: null,
      isVariant: false,
      baseExerciseId: null,
    }));
  }

  for (const row of exercisesToAdd) {
    const pe = row.planExercise;
    const ex = row.exercise;

    const last = await getLastSessionWeights(ex.id);
    const suggestion = deload ? null : await getPendingSuggestion(ex.id);

    let defaultWeight = num(pe.defaultWeight);
    let defaultSets = pe.defaultSets;

    if (deload && last) {
      defaultWeight = last.maxWeight * DELOAD_WEIGHT_FACTOR;
      defaultSets = Math.max(1, Math.ceil(last.sets * DELOAD_SETS_FACTOR));
    } else if (suggestion) {
      defaultWeight = num(suggestion.suggestedWeightKg);
    } else if (last) {
      defaultWeight = last.maxWeight;
    }

    const [se] = await db
      .insert(sessionExercises)
      .values({
        sessionId: session.id,
        exerciseId: ex.id,
        sortOrder: pe.sortOrder,
      })
      .returning();

    const workingSetCount = defaultSets;
    for (let i = 1; i <= workingSetCount; i++) {
      await db.insert(sessionSets).values({
        sessionExerciseId: se.id,
        setNumber: i,
        weightKg: defaultWeight != null ? String(defaultWeight) : null,
        isWarmup: false,
        isCompleted: false,
      });
    }
  }

  return getSessionDetail(session.id);
}

export async function cloneSession(sourceSessionId: number) {
  const source = await getSessionDetail(sourceSessionId);
  if (!source) throw new Error("Session not found");

  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId: CURRENT_USER_ID,
      planId: source.planId,
      startedAt: new Date(),
      isDeload: false,
      clonedFromId: sourceSessionId,
    })
    .returning();

  for (const ex of source.exercises) {
    const workingSets = ex.sets.filter((s) => !s.isWarmup);
    const lastWeight =
      workingSets
        .map((s) => num(s.weightKg))
        .filter((w): w is number => w != null)
        .sort((a, b) => b - a)[0] ?? null;

    const [se] = await db
      .insert(sessionExercises)
      .values({
        sessionId: session.id,
        exerciseId: ex.exerciseId,
        sortOrder: ex.sortOrder,
        notes: ex.notes,
      })
      .returning();

    const count = workingSets.length || 3;
    for (let i = 1; i <= count; i++) {
      const src = workingSets[i - 1];
      await db.insert(sessionSets).values({
        sessionExerciseId: se.id,
        setNumber: i,
        reps: src?.reps ?? null,
        weightKg: lastWeight != null ? String(lastWeight) : src?.weightKg,
        isWarmup: false,
        isCompleted: false,
      });
    }
  }

  return getSessionDetail(session.id);
}

export async function getSessionDetail(sessionId: number) {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  const exList = await db
    .select({
      sessionExercise: sessionExercises,
      exercise: exercises,
      muscleGroup: muscleGroups,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .leftJoin(muscleGroups, eq(exercises.muscleGroupId, muscleGroups.id))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(sessionExercises.sortOrder);

  const exercisesWithSets = await Promise.all(
    exList.map(async (row) => {
      const sets = await db
        .select()
        .from(sessionSets)
        .where(eq(sessionSets.sessionExerciseId, row.sessionExercise.id))
        .orderBy(sessionSets.setNumber);

      const suggestion = session.isDeload
        ? null
        : await getPendingSuggestion(row.exercise.id);

      const lastPerf = await getLastSessionPerformance(
        row.exercise.id,
        sessionId
      );

      const isUserAdded = row.sessionExercise.notes === USER_ADDED_MARKER;

      return {
        ...row.sessionExercise,
        notes: isUserAdded ? null : row.sessionExercise.notes,
        isUserAdded,
        exercise: row.exercise,
        muscleGroup: row.muscleGroup,
        sets,
        suggestion,
        lastPerformance: lastPerf,
      };
    })
  );

  return {
    ...session,
    exercises: exercisesWithSets,
  };
}

async function getLastSessionPerformance(
  exerciseId: number,
  excludeSessionId: number
) {
  const recentSessions = await db
    .select({ id: workoutSessions.id, sessionDate: workoutSessions.sessionDate })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, CURRENT_USER_ID),
        ne(workoutSessions.id, excludeSessionId)
      )
    )
    .orderBy(desc(workoutSessions.sessionDate))
    .limit(5);

  for (const sess of recentSessions) {
    const [se] = await db
      .select()
      .from(sessionExercises)
      .where(
        and(
          eq(sessionExercises.sessionId, sess.id),
          eq(sessionExercises.exerciseId, exerciseId)
        )
      )
      .limit(1);

    if (!se) continue;

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

    if (sets.length > 0) {
      return { sessionDate: sess.sessionDate, sets };
    }
  }
  return null;
}

export async function completeSession(
  sessionId: number,
  data: { sessionNotes?: string; overallFeel?: number }
) {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  if (!session || session.endedAt) throw new Error("Invalid session");

  const endedAt = new Date();
  const durationMins = session.startedAt
    ? Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000)
    : null;

  await db
    .update(workoutSessions)
    .set({
      endedAt,
      durationMins,
      sessionNotes: data.sessionNotes,
      overallFeel: data.overallFeel,
    })
    .where(eq(workoutSessions.id, sessionId));

  if (!session.isDeload) {
    await updatePersonalRecords(sessionId);
    await computeOverloadSuggestions(sessionId);
  }

  const today = await getTodayPlan();
  if (today && session.planId === today.plan?.id) {
    await advanceProgramDay(today.program.id);
  }

  return getSessionDetail(sessionId);
}

export async function logSet(
  setId: number,
  data: {
    reps?: number;
    weightKg?: number | null;
    rpe?: number | null;
    isCompleted?: boolean;
  }
) {
  const [set] = await db
    .select({
      set: sessionSets,
      sessionExercise: sessionExercises,
    })
    .from(sessionSets)
    .innerJoin(
      sessionExercises,
      eq(sessionSets.sessionExerciseId, sessionExercises.id)
    )
    .where(eq(sessionSets.id, setId))
    .limit(1);

  if (!set) throw new Error("Set not found");

  const updates: Partial<typeof sessionSets.$inferInsert> = {};
  if (data.reps !== undefined) updates.reps = data.reps;
  if (data.weightKg !== undefined) {
    updates.weightKg =
      data.weightKg != null ? String(data.weightKg) : null;
  }
  if (data.rpe !== undefined) updates.rpe = data.rpe;
  if (data.isCompleted !== undefined) updates.isCompleted = data.isCompleted;

  await db.update(sessionSets).set(updates).where(eq(sessionSets.id, setId));

  if (data.weightKg != null && !set.set.isWarmup) {
    const suggestion = await getPendingSuggestion(set.sessionExercise.exerciseId);
    if (suggestion && num(suggestion.suggestedWeightKg) === data.weightKg) {
      await markSuggestionApplied(set.sessionExercise.exerciseId);
    }
  }

  return set;
}

async function getPlanDefaultsForExercise(
  exerciseId: number,
  planId: number | null
) {
  if (planId) {
    const [forPlan] = await db
      .select()
      .from(workoutPlanExercises)
      .where(
        and(
          eq(workoutPlanExercises.exerciseId, exerciseId),
          eq(workoutPlanExercises.planId, planId)
        )
      )
      .limit(1);
    if (forPlan) return forPlan;
  }

  const [anyPlan] = await db
    .select()
    .from(workoutPlanExercises)
    .where(eq(workoutPlanExercises.exerciseId, exerciseId))
    .orderBy(asc(workoutPlanExercises.id))
    .limit(1);

  return anyPlan ?? null;
}

export async function addSessionExercise(sessionId: number, exerciseId: number) {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  if (!session || session.endedAt) throw new Error("Invalid session");

  const existing = await db
    .select({ id: sessionExercises.id })
    .from(sessionExercises)
    .where(
      and(
        eq(sessionExercises.sessionId, sessionId),
        eq(sessionExercises.exerciseId, exerciseId)
      )
    )
    .limit(1);

  if (existing.length > 0) throw new Error("Exercise already in session");

  const sortRows = await db
    .select({ sortOrder: sessionExercises.sortOrder })
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId));

  const maxSort = sortRows.reduce((m, r) => Math.max(m, r.sortOrder), -1);

  const planDefaults = await getPlanDefaultsForExercise(
    exerciseId,
    session.planId
  );

  const defaultSets = planDefaults?.defaultSets ?? 3;
  const defaultReps = parseDefaultReps(planDefaults?.defaultReps ?? "8-12");
  const defaultRestSeconds = planDefaults?.defaultRestSeconds ?? 90;

  const suggestion = session.isDeload
    ? null
    : await getPendingSuggestion(exerciseId);

  let defaultWeight = num(planDefaults?.defaultWeight);
  if (suggestion) {
    defaultWeight = num(suggestion.suggestedWeightKg);
  } else if (!defaultWeight) {
    const last = await getLastSessionWeights(exerciseId);
    if (last) defaultWeight = last.maxWeight;
  }

  const [se] = await db
    .insert(sessionExercises)
    .values({
      sessionId,
      exerciseId,
      sortOrder: maxSort + 1,
      notes: USER_ADDED_MARKER,
    })
    .returning();

  for (let i = 1; i <= defaultSets; i++) {
    await db.insert(sessionSets).values({
      sessionExerciseId: se.id,
      setNumber: i,
      reps: defaultReps,
      weightKg: defaultWeight != null ? String(defaultWeight) : null,
      isWarmup: false,
      isCompleted: false,
    });
  }

  const detail = await getSessionDetail(sessionId);
  const added = detail?.exercises.find((e) => e.id === se.id);

  return {
    sessionExercise: added,
    defaultRestSeconds,
  };
}

export async function addWarmupSet(sessionExerciseId: number) {
  const sets = await db
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.sessionExerciseId, sessionExerciseId));

  const warmupCount = sets.filter((s) => s.isWarmup).length;
  const minSetNum = Math.min(...sets.map((s) => s.setNumber), 0);

  const [newSet] = await db
    .insert(sessionSets)
    .values({
      sessionExerciseId,
      setNumber: minSetNum > 0 ? minSetNum - 1 : -(warmupCount + 1),
      isWarmup: true,
      isCompleted: false,
    })
    .returning();

  return newSet;
}

async function getActiveSessionExercise(
  sessionId: number,
  sessionExerciseId: number
) {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  if (!session || session.endedAt) throw new Error("Invalid session");

  const [row] = await db
    .select({
      sessionExercise: sessionExercises,
      exercise: exercises,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(
      and(
        eq(sessionExercises.id, sessionExerciseId),
        eq(sessionExercises.sessionId, sessionId)
      )
    )
    .limit(1);

  if (!row) throw new Error("Exercise not found in session");

  return { session, ...row };
}

export async function removeSessionExerciseOnly(
  sessionId: number,
  sessionExerciseId: number
) {
  await getActiveSessionExercise(sessionId, sessionExerciseId);

  await db
    .delete(sessionExercises)
    .where(eq(sessionExercises.id, sessionExerciseId));
}

export async function removeExerciseFromPlanPermanently(
  sessionId: number,
  sessionExerciseId: number
) {
  const { session, sessionExercise } = await getActiveSessionExercise(
    sessionId,
    sessionExerciseId
  );

  if (!session.planId) {
    throw new Error("No plan linked to this session");
  }

  const exerciseId = sessionExercise.exerciseId;
  const planId = session.planId;

  await db
    .delete(workoutPlanExercises)
    .where(
      and(
        eq(workoutPlanExercises.planId, planId),
        eq(workoutPlanExercises.exerciseId, exerciseId)
      )
    );

  await db
    .delete(planExerciseVariations)
    .where(
      and(
        eq(planExerciseVariations.planId, planId),
        or(
          eq(planExerciseVariations.baseExerciseId, exerciseId),
          eq(planExerciseVariations.variantExerciseId, exerciseId)
        )
      )
    );

  await db
    .delete(sessionExercises)
    .where(eq(sessionExercises.id, sessionExerciseId));

  const [plan] = await db
    .select({ name: workoutPlans.name })
    .from(workoutPlans)
    .where(eq(workoutPlans.id, planId))
    .limit(1);

  return { planName: plan?.name ?? "this plan" };
}

export async function swapExercise(
  sessionExerciseId: number,
  newExerciseId: number,
  originalExerciseId: number
) {
  await db
    .update(sessionExercises)
    .set({ exerciseId: newExerciseId })
    .where(eq(sessionExercises.id, sessionExerciseId));

  await db.insert(sessionExerciseSwaps).values({
    sessionExerciseId,
    originalExerciseId,
    swappedExerciseId: newExerciseId,
    isSuggested: false,
  });
}
