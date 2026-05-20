import { and, desc, eq, inArray, isNotNull, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  exercises,
  muscleGroups,
  sessionExercises,
  workoutPlans,
  workoutSessions,
} from "@/lib/db/schema";
import { requireUserId } from "@/lib/services/user";
import { muscleGroupsForSplit } from "@/lib/split-muscles";

export type SuggestedExercise = {
  id: number;
  name: string;
  muscleGroupName: string | null;
  equipment: string | null;
  difficulty: string | null;
  youtubeQuery: string | null;
};

async function getSessionExerciseIds(sessionId: number) {
  const rows = await db
    .select({ exerciseId: sessionExercises.exerciseId })
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId));
  return new Set(rows.map((r) => r.exerciseId));
}

/** Per muscle group: exercise IDs done in the last 2 sessions that trained that group. */
async function recentDoneByMuscleGroup(): Promise<Map<string, Set<number>>> {
  const userId = await requireUserId();
  const recentSessions = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.endedAt)
      )
    )
    .orderBy(desc(workoutSessions.sessionDate), desc(workoutSessions.id))
    .limit(30);

  const result = new Map<string, Set<number>>();
  const sessionCounts = new Map<string, number>();

  for (const sess of recentSessions) {
    const rows = await db
      .select({
        exerciseId: sessionExercises.exerciseId,
        muscleGroupName: muscleGroups.name,
      })
      .from(sessionExercises)
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .innerJoin(muscleGroups, eq(exercises.muscleGroupId, muscleGroups.id))
      .where(eq(sessionExercises.sessionId, sess.id));

    const musclesInSession = new Set(
      rows.map((r) => r.muscleGroupName).filter((n): n is string => !!n)
    );

    for (const mg of musclesInSession) {
      const count = sessionCounts.get(mg) ?? 0;
      if (count >= 2) continue;

      sessionCounts.set(mg, count + 1);
      const set = result.get(mg) ?? new Set<number>();
      for (const r of rows) {
        if (r.muscleGroupName === mg) set.add(r.exerciseId);
      }
      result.set(mg, set);
    }
  }

  return result;
}

export async function suggestExercises(params: {
  planId: number;
  sessionId: number;
  userId?: number;
}): Promise<SuggestedExercise[]> {
  const userId = params.userId ?? (await requireUserId());

  const [plan] = await db
    .select()
    .from(workoutPlans)
    .where(eq(workoutPlans.id, params.planId))
    .limit(1);

  if (!plan) return [];

  const splitMuscles = muscleGroupsForSplit(plan.splitType);
  const excludeIds = await getSessionExerciseIds(params.sessionId);

  const library = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      equipment: exercises.equipment,
      difficulty: exercises.difficulty,
      youtubeQuery: exercises.youtubeQuery,
      muscleGroupName: muscleGroups.name,
    })
    .from(exercises)
    .leftJoin(muscleGroups, eq(exercises.muscleGroupId, muscleGroups.id))
    .where(
      and(
        or(isNull(exercises.userId), eq(exercises.userId, userId)),
        splitMuscles
          ? inArray(muscleGroups.name, [...splitMuscles])
          : undefined
      )
    );

  const candidates = library.filter((ex) => !excludeIds.has(ex.id));
  const recentByMuscle = await recentDoneByMuscleGroup();

  const ranked = candidates.map((ex) => {
    let priority = 0;
    if (ex.muscleGroupName) {
      const recent = recentByMuscle.get(ex.muscleGroupName);
      if (recent?.has(ex.id)) priority = 1;
    }
    return { ex, priority };
  });

  ranked.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.ex.name.localeCompare(b.ex.name);
  });

  return ranked.slice(0, 3).map(({ ex }) => ({
    id: ex.id,
    name: ex.name,
    muscleGroupName: ex.muscleGroupName,
    equipment: ex.equipment,
    difficulty: ex.difficulty,
    youtubeQuery: ex.youtubeQuery,
  }));
}
