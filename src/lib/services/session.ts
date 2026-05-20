import { and, asc, desc, eq, isNotNull, isNull, ne, or } from "drizzle-orm";
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
import { DELOAD_SETS_FACTOR, DELOAD_WEIGHT_FACTOR } from "@/lib/config";
import { requireUserId } from "@/lib/services/user";
import { getTodayPlan, advanceProgramDay } from "./program";
import { getPendingSuggestion, markSuggestionApplied, computeOverloadSuggestions } from "./overload";
import { updatePersonalRecords } from "./pr";
import { getPreferredUnit } from "./user";
import { parseDefaultReps } from "@/lib/parse-reps";
import { resolveSetDefaults } from "@/lib/workout/set-defaults";

export const USER_ADDED_MARKER = "__user_added__";

export async function getExercisePreviewsForToday(
  rows: {
    planExercise: {
      defaultSets: number;
      defaultReps: string;
      defaultWeight: string | null;
    };
    exercise: { id: number };
  }[],
  deload: boolean
) {
  return Promise.all(
    rows.map(async (row) => {
      const last = await getLastSessionWeights(row.exercise.id);
      const suggestion = deload
        ? null
        : await getPendingSuggestion(row.exercise.id);
      const defaults = resolveSetDefaults(row.planExercise, {
        deload,
        last,
        suggestion,
      });
      return {
        exerciseId: row.exercise.id,
        ...defaults,
      };
    })
  );
}

export async function getActiveSessionOrNull() {
  const userId = await requireUserId();
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNull(workoutSessions.endedAt)
      )
    )
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);

  return session ?? null;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function getLastCompletedPlanIdToday() {
  const userId = await requireUserId();
  const today = todayDateString();
  const [row] = await db
    .select({ planId: workoutSessions.planId })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.endedAt),
        eq(workoutSessions.sessionDate, today),
        eq(workoutSessions.isPreview, false)
      )
    )
    .orderBy(desc(workoutSessions.endedAt))
    .limit(1);

  return row?.planId ?? null;
}

async function abandonPreviewSession(sessionId: number) {
  const userId = await requireUserId();
  await db
    .delete(workoutSessions)
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.isPreview, true)
      )
    );
}

export type StartSessionOptions = {
  planId?: number;
  preview?: boolean;
  extraToday?: boolean;
};

async function createSessionForPlan(
  pid: number,
  deload: boolean,
  isPreview: boolean
) {
  const userId = await requireUserId();
  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId,
      planId: pid,
      startedAt: new Date(),
      isDeload: deload,
      isPreview,
    })
    .returning();

  const today = await getTodayPlan();
  let exercisesToAdd = today?.exercises ?? [];

  if (!today?.plan || pid !== today.plan.id) {
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
    const defaults = resolveSetDefaults(pe, { deload, last, suggestion });

    const [se] = await db
      .insert(sessionExercises)
      .values({
        sessionId: session.id,
        exerciseId: ex.id,
        sortOrder: pe.sortOrder,
        supersetGroupId: pe.supersetGroupId,
      })
      .returning();

    for (let i = 1; i <= defaults.setCount; i++) {
      await db.insert(sessionSets).values({
        sessionExerciseId: se.id,
        setNumber: i,
        reps: defaults.reps,
        weightKg: defaults.weightKg != null ? String(defaults.weightKg) : null,
        isWarmup: false,
        isCompleted: false,
      });
    }
  }

  return getSessionDetail(session.id);
}

async function getLastSessionWeights(exerciseId: number) {
  const userId = await requireUserId();
  const recentSessions = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
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

export async function startSession(
  options?: StartSessionOptions | number
) {
  const opts: StartSessionOptions =
    typeof options === "number" ? { planId: options } : (options ?? {});

  const existing = await getActiveSessionOrNull();

  if (opts.preview) {
    if (existing?.isPreview) return getSessionDetail(existing.id);
    if (existing && !existing.isPreview) {
      return getSessionDetail(existing.id);
    }

    const today = await getTodayPlan();
    if (!today?.plan) throw new Error("No workout plan for today");

    return createSessionForPlan(today.plan.id, today.deload, true);
  }

  if (opts.extraToday) {
    if (existing?.isPreview) {
      await abandonPreviewSession(existing.id);
    } else if (existing && !existing.isPreview) {
      return getSessionDetail(existing.id);
    }

    const today = await getTodayPlan();
    const pid =
      opts.planId ?? (await getLastCompletedPlanIdToday()) ?? today?.plan?.id;
    if (!pid) throw new Error("No workout plan for today");

    const deload = today?.deload ?? false;
    return createSessionForPlan(pid, deload, false);
  }

  if (existing) return getSessionDetail(existing.id);

  const today = await getTodayPlan();
  if (!today?.plan) throw new Error("No workout plan for today");

  const pid = opts.planId ?? today.plan.id;
  return createSessionForPlan(pid, today.deload, false);
}

export async function cloneSession(sourceSessionId: number) {
  const userId = await requireUserId();
  const source = await getSessionDetail(sourceSessionId);
  if (!source) throw new Error("Session not found");

  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId,
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
        supersetGroupId: ex.supersetGroupId,
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
  const userId = await requireUserId();
  const recentSessions = await db
    .select({ id: workoutSessions.id, sessionDate: workoutSessions.sessionDate })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
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
      const typical = getTypicalFromSets(sets);
      return { sessionDate: sess.sessionDate, sets, typical };
    }
  }
  return null;
}

function getTypicalFromSets(
  sets: { reps: number | null; weightKg: string | null }[]
) {
  const working = sets.filter((s) => s.reps != null || s.weightKg != null);
  if (working.length === 0) return null;

  const repCounts = new Map<number, number>();
  const weightCounts = new Map<number, number>();
  for (const s of working) {
    if (s.reps != null) {
      repCounts.set(s.reps, (repCounts.get(s.reps) ?? 0) + 1);
    }
    const w = num(s.weightKg);
    if (w != null) {
      weightCounts.set(w, (weightCounts.get(w) ?? 0) + 1);
    }
  }

  const modeReps =
    repCounts.size > 0
      ? [...repCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;
  const modeWeight =
    weightCounts.size > 0
      ? [...weightCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;

  const first = working[0];
  return {
    reps: modeReps ?? first.reps,
    weightKg: modeWeight ?? num(first.weightKg),
  };
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

  if (session.isPreview) {
    await db
      .update(workoutSessions)
      .set({
        endedAt,
        durationMins,
        sessionNotes: data.sessionNotes ?? null,
      })
      .where(eq(workoutSessions.id, sessionId));
    return getSessionDetail(sessionId);
  }

  const sessionDate = endedAt.toISOString().slice(0, 10);

  await db
    .update(workoutSessions)
    .set({
      endedAt,
      sessionDate,
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

export async function addSessionExercise(
  sessionId: number,
  exerciseId: number,
  options?: { skipUserAddedMarker?: boolean }
) {
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

  const defaultRestSeconds = planDefaults?.defaultRestSeconds ?? 90;
  const suggestion = session.isDeload
    ? null
    : await getPendingSuggestion(exerciseId);
  const last = await getLastSessionWeights(exerciseId);
  const defaults = resolveSetDefaults(
    {
      defaultSets: planDefaults?.defaultSets ?? 3,
      defaultReps: planDefaults?.defaultReps ?? "8-12",
      defaultWeight: planDefaults?.defaultWeight ?? null,
    },
    { deload: session.isDeload, last, suggestion }
  );

  const [se] = await db
    .insert(sessionExercises)
    .values({
      sessionId,
      exerciseId,
      sortOrder: maxSort + 1,
      notes: options?.skipUserAddedMarker ? null : USER_ADDED_MARKER,
    })
    .returning();

  for (let i = 1; i <= defaults.setCount; i++) {
    await db.insert(sessionSets).values({
      sessionExerciseId: se.id,
      setNumber: i,
      reps: defaults.reps,
      weightKg: defaults.weightKg != null ? String(defaults.weightKg) : null,
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

export async function deleteSet(setId: number) {
  const [set] = await db
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.id, setId))
    .limit(1);

  if (!set) throw new Error("Set not found");

  await db.delete(sessionSets).where(eq(sessionSets.id, setId));
}

export async function reorderSessionExercises(
  sessionId: number,
  orderedSessionExerciseIds: number[]
) {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  if (!session || session.endedAt) throw new Error("Invalid session");

  const rows = await db
    .select({ id: sessionExercises.id })
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId));

  const existingIds = new Set(rows.map((r) => r.id));
  if (orderedSessionExerciseIds.length !== existingIds.size) {
    throw new Error("Order must include every exercise in the session");
  }
  for (const id of orderedSessionExerciseIds) {
    if (!existingIds.has(id)) throw new Error("Invalid exercise in order");
  }

  await Promise.all(
    orderedSessionExerciseIds.map((id, index) =>
      db
        .update(sessionExercises)
        .set({ sortOrder: index })
        .where(eq(sessionExercises.id, id))
    )
  );
}

export async function addExerciseToPlanPermanently(
  sessionId: number,
  exerciseId: number
) {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  if (!session || session.endedAt) throw new Error("Invalid session");
  if (!session.planId) throw new Error("No plan linked to this session");

  const planId = session.planId;

  const [existingPlan] = await db
    .select({ id: workoutPlanExercises.id })
    .from(workoutPlanExercises)
    .where(
      and(
        eq(workoutPlanExercises.planId, planId),
        eq(workoutPlanExercises.exerciseId, exerciseId)
      )
    )
    .limit(1);

  if (!existingPlan) {
    const sortRows = await db
      .select({ sortOrder: workoutPlanExercises.sortOrder })
      .from(workoutPlanExercises)
      .where(eq(workoutPlanExercises.planId, planId));

    const maxSort = sortRows.reduce((m, r) => Math.max(m, r.sortOrder), -1);
    const planDefaults = await getPlanDefaultsForExercise(exerciseId, planId);

    await db.insert(workoutPlanExercises).values({
      planId,
      exerciseId,
      sortOrder: maxSort + 1,
      defaultSets: planDefaults?.defaultSets ?? 3,
      defaultReps: planDefaults?.defaultReps ?? "8-12",
      defaultWeight: planDefaults?.defaultWeight,
      defaultRestSeconds: planDefaults?.defaultRestSeconds ?? 90,
    });
  }

  const inSession = await db
    .select({ id: sessionExercises.id, notes: sessionExercises.notes })
    .from(sessionExercises)
    .where(
      and(
        eq(sessionExercises.sessionId, sessionId),
        eq(sessionExercises.exerciseId, exerciseId)
      )
    )
    .limit(1);

  if (inSession.length > 0) {
    const row = inSession[0];
    if (row.notes === USER_ADDED_MARKER) {
      await db
        .update(sessionExercises)
        .set({ notes: null })
        .where(eq(sessionExercises.id, row.id));
    }
    const detail = await getSessionDetail(sessionId);
    const block = detail?.exercises.find((e) => e.id === row.id);
    const [plan] = await db
      .select({ name: workoutPlans.name })
      .from(workoutPlans)
      .where(eq(workoutPlans.id, planId))
      .limit(1);
    return { sessionExercise: block, planName: plan?.name ?? "this plan", defaultRestSeconds: 90 };
  }

  const added = await addSessionExercise(sessionId, exerciseId, {
    skipUserAddedMarker: true,
  });
  const [plan] = await db
    .select({ name: workoutPlans.name })
    .from(workoutPlans)
    .where(eq(workoutPlans.id, planId))
    .limit(1);
  return { ...added, planName: plan?.name ?? "this plan" };
}

export async function linkSuperset(
  sessionId: number,
  anchorSessionExerciseId: number,
  partnerSessionExerciseId: number
) {
  if (anchorSessionExerciseId === partnerSessionExerciseId) {
    throw new Error("Pick a different exercise to superset with");
  }

  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  if (!session || session.endedAt) throw new Error("Invalid session");

  const rows = await db
    .select({
      id: sessionExercises.id,
      sortOrder: sessionExercises.sortOrder,
      supersetGroupId: sessionExercises.supersetGroupId,
    })
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(sessionExercises.sortOrder);

  const anchor = rows.find((r) => r.id === anchorSessionExerciseId);
  const partner = rows.find((r) => r.id === partnerSessionExerciseId);
  if (!anchor || !partner) throw new Error("Exercise not in session");

  const pairIds = new Set([anchorSessionExerciseId, partnerSessionExerciseId]);
  const usedGroups = rows
    .filter((r) => pairIds.has(r.id) && r.supersetGroupId != null)
    .map((r) => r.supersetGroupId as number);
  const groupId =
    usedGroups.length > 0 ? Math.min(...usedGroups) : Date.now() % 1_000_000;

  await Promise.all(
    [anchorSessionExerciseId, partnerSessionExerciseId].map((id) =>
      db
        .update(sessionExercises)
        .set({ supersetGroupId: groupId })
        .where(eq(sessionExercises.id, id))
    )
  );

  const ordered = [...rows];
  const partnerIdx = ordered.findIndex((r) => r.id === partnerSessionExerciseId);
  const [partnerRow] = ordered.splice(partnerIdx, 1);
  const anchorIdx = ordered.findIndex((r) => r.id === anchorSessionExerciseId);
  ordered.splice(anchorIdx + 1, 0, partnerRow);

  await reorderSessionExercises(
    sessionId,
    ordered.map((r) => r.id)
  );

  return { supersetGroupId: groupId };
}

export async function unlinkFromSuperset(sessionExerciseId: number) {
  const [row] = await db
    .select({
      id: sessionExercises.id,
      sessionId: sessionExercises.sessionId,
      supersetGroupId: sessionExercises.supersetGroupId,
    })
    .from(sessionExercises)
    .where(eq(sessionExercises.id, sessionExerciseId))
    .limit(1);

  if (!row?.supersetGroupId) return;

  const groupMembers = await db
    .select({ id: sessionExercises.id })
    .from(sessionExercises)
    .where(
      and(
        eq(sessionExercises.sessionId, row.sessionId),
        eq(sessionExercises.supersetGroupId, row.supersetGroupId)
      )
    );

  const idsToClear =
    groupMembers.length <= 2
      ? groupMembers.map((m) => m.id)
      : [sessionExerciseId];

  await Promise.all(
    idsToClear.map((id) =>
      db
        .update(sessionExercises)
        .set({ supersetGroupId: null })
        .where(eq(sessionExercises.id, id))
    )
  );
}

export async function addWorkingSet(sessionExerciseId: number) {
  const sets = await db
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.sessionExerciseId, sessionExerciseId));

  const working = sets.filter((s) => !s.isWarmup);
  const maxSetNum = working.reduce((m, s) => Math.max(m, s.setNumber), 0);
  const lastWorking = [...working].sort((a, b) => b.setNumber - a.setNumber)[0];

  const [newSet] = await db
    .insert(sessionSets)
    .values({
      sessionExerciseId,
      setNumber: maxSetNum + 1,
      reps: lastWorking?.reps ?? null,
      weightKg: lastWorking?.weightKg ?? null,
      isWarmup: false,
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
