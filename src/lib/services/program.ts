import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  userPrograms,
  programDays,
  programs,
  workoutPlans,
  workoutPlanExercises,
  planExerciseVariations,
  exercises,
  muscleGroups,
  workoutSessions,
  num,
} from "@/lib/db/schema";
import { requireUserId } from "@/lib/services/user";

export async function getActiveUserProgram() {
  const userId = await requireUserId();
  const [up] = await db
    .select({
      userProgram: userPrograms,
      program: programs,
    })
    .from(userPrograms)
    .innerJoin(programs, eq(userPrograms.programId, programs.id))
    .where(
      and(
        eq(userPrograms.userId, userId),
        eq(userPrograms.isActive, true)
      )
    )
    .limit(1);
  return up ?? null;
}

export function isDeloadWeek(
  currentWeek: number,
  deloadInterval: number
): boolean {
  if (deloadInterval <= 0) return false;
  return currentWeek % deloadInterval === 0;
}

export async function getTodayPlan() {
  const active = await getActiveUserProgram();
  if (!active) return null;

  const { userProgram, program } = active;
  const dayNum = userProgram.nextDayNumber;

  const [day] = await db
    .select({
      programDay: programDays,
      plan: workoutPlans,
    })
    .from(programDays)
    .leftJoin(workoutPlans, eq(programDays.planId, workoutPlans.id))
    .where(
      and(
        eq(programDays.programId, program.id),
        eq(programDays.dayNumber, dayNum)
      )
    )
    .limit(1);

  if (!day) return null;

  const deload = isDeloadWeek(
    userProgram.currentWeek,
    program.deloadWeekInterval
  );

  if (day.programDay.restDay || !day.plan) {
    return {
      userProgram,
      program,
      programDay: day.programDay,
      plan: null,
      exercises: [],
      deload,
      rotationCount: 0,
    };
  }

  const planExercises = await db
    .select({
      planExercise: workoutPlanExercises,
      exercise: exercises,
      muscleGroup: muscleGroups,
    })
    .from(workoutPlanExercises)
    .innerJoin(exercises, eq(workoutPlanExercises.exerciseId, exercises.id))
    .leftJoin(muscleGroups, eq(exercises.muscleGroupId, muscleGroups.id))
    .where(eq(workoutPlanExercises.planId, day.plan.id))
    .orderBy(workoutPlanExercises.sortOrder);

  const week = userProgram.currentWeek;
  const variations =
    week === 2 || week === 4
      ? await db
          .select()
          .from(planExerciseVariations)
          .where(
            and(
              eq(planExerciseVariations.planId, day.plan.id),
              eq(planExerciseVariations.weekNumber, week)
            )
          )
      : [];

  const variantMap = new Map(
    variations.map((v) => [v.baseExerciseId, v])
  );

  let rotationCount = 0;
  const resolved = await Promise.all(
    planExercises.map(async (row) => {
      const variant = variantMap.get(row.planExercise.exerciseId);
      if (variant) {
        rotationCount++;
        const [variantEx] = await db
          .select({
            exercise: exercises,
            muscleGroup: muscleGroups,
          })
          .from(exercises)
          .leftJoin(muscleGroups, eq(exercises.muscleGroupId, muscleGroups.id))
          .where(eq(exercises.id, variant.variantExerciseId))
          .limit(1);
        if (variantEx) {
          return {
            planExercise: {
              ...row.planExercise,
              exerciseId: variant.variantExerciseId,
              defaultSets: variant.defaultSets,
              defaultReps: variant.defaultReps,
              defaultRestSeconds: variant.defaultRestSeconds,
            },
            exercise: variantEx.exercise,
            muscleGroup: variantEx.muscleGroup,
            isVariant: true,
            baseExerciseId: row.planExercise.exerciseId,
          };
        }
      }
      return {
        ...row,
        isVariant: false,
        baseExerciseId: null as number | null,
      };
    })
  );

  return {
    userProgram,
    program,
    programDay: day.programDay,
    plan: day.plan,
    exercises: resolved,
    deload,
    rotationCount,
  };
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function hasCompletedTodayWorkout(planId: number | null) {
  if (!planId) return false;
  const userId = await requireUserId();
  const today = todayDateString();
  const [row] = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.planId, planId),
        isNotNull(workoutSessions.endedAt),
        eq(workoutSessions.sessionDate, today),
        eq(workoutSessions.isPreview, false)
      )
    )
    .limit(1);
  return !!row;
}

/** Any finished (non-preview) session today. */
export async function hasCompletedWorkoutToday() {
  const userId = await requireUserId();
  const today = todayDateString();
  const [row] = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.endedAt),
        eq(workoutSessions.sessionDate, today),
        eq(workoutSessions.isPreview, false)
      )
    )
    .limit(1);
  return !!row;
}

export async function getNextWorkoutPreview() {
  const active = await getActiveUserProgram();
  if (!active) return null;

  const { userProgram, program } = active;
  const allDays = await db
    .select({
      programDay: programDays,
      plan: workoutPlans,
    })
    .from(programDays)
    .leftJoin(workoutPlans, eq(programDays.planId, workoutPlans.id))
    .where(eq(programDays.programId, program.id))
    .orderBy(programDays.dayNumber);

  if (allDays.length === 0) return null;

  const completedToday = await hasCompletedWorkoutToday();
  const dayNum = userProgram.nextDayNumber;
  const week = userProgram.currentWeek;

  const target = allDays.find((d) => d.programDay.dayNumber === dayNum);
  if (!target) return null;

  const deload = isDeloadWeek(week, program.deloadWeekInterval);

  return {
    completedToday,
    week,
    dayNumber: dayNum,
    programDay: target.programDay,
    plan: target.plan,
    deload,
  };
}

export async function advanceProgramDay(programId: number) {
  const active = await getActiveUserProgram();
  if (!active || active.program.id !== programId) return;

  const { userProgram, program } = active;

  const allDays = await db
    .select()
    .from(programDays)
    .where(eq(programDays.programId, programId))
    .orderBy(programDays.dayNumber);

  const maxDay = Math.max(...allDays.map((d) => d.dayNumber));
  let nextDay = userProgram.nextDayNumber + 1;
  let currentWeek = userProgram.currentWeek;

  if (nextDay > maxDay) {
    nextDay = 1;
    currentWeek += 1;
  }

  await db
    .update(userPrograms)
    .set({
      nextDayNumber: nextDay,
      currentWeek,
    })
    .where(eq(userPrograms.id, userProgram.id));
}

export async function getActiveProgramDays() {
  const active = await getActiveUserProgram();
  if (!active) return null;

  const days = await db
    .select({
      dayNumber: programDays.dayNumber,
      label: programDays.label,
      restDay: programDays.restDay,
      planName: workoutPlans.name,
    })
    .from(programDays)
    .leftJoin(workoutPlans, eq(programDays.planId, workoutPlans.id))
    .where(eq(programDays.programId, active.program.id))
    .orderBy(programDays.dayNumber);

  return {
    currentWeek: active.userProgram.currentWeek,
    nextDayNumber: active.userProgram.nextDayNumber,
    days,
  };
}

/** Drop unfinished sessions so Today shows Start, not Resume. */
async function abandonIncompleteSessions(userId: number) {
  await db
    .delete(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNull(workoutSessions.endedAt)
      )
    );
}

/** Reset active program to Week 1 on a chosen day. Keeps completed session history. */
export async function resetProgramToWeek1(dayNumber = 1) {
  const active = await getActiveUserProgram();
  if (!active) return null;

  const { userProgram, program } = active;
  const [day] = await db
    .select({ dayNumber: programDays.dayNumber })
    .from(programDays)
    .where(
      and(
        eq(programDays.programId, program.id),
        eq(programDays.dayNumber, dayNumber)
      )
    )
    .limit(1);

  if (!day) return { error: "invalid_day" as const };

  await abandonIncompleteSessions(userProgram.userId);

  await db
    .update(userPrograms)
    .set({
      currentWeek: 1,
      nextDayNumber: dayNumber,
    })
    .where(eq(userPrograms.id, userProgram.id));

  return { currentWeek: 1, nextDayNumber: dayNumber };
}

export { num };
