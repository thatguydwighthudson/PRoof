import { and, eq } from "drizzle-orm";
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
  num,
} from "@/lib/db/schema";
import { CURRENT_USER_ID } from "@/lib/config";

export async function getActiveUserProgram() {
  const [up] = await db
    .select({
      userProgram: userPrograms,
      program: programs,
    })
    .from(userPrograms)
    .innerJoin(programs, eq(userPrograms.programId, programs.id))
    .where(
      and(
        eq(userPrograms.userId, CURRENT_USER_ID),
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

export { num };
