export const dynamic = "force-dynamic";

import { eq, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, muscleGroups } from "@/lib/db/schema";
import { CURRENT_USER_ID } from "@/lib/config";
import { ExerciseBrowser } from "@/components/exercises/exercise-browser";

export default async function ExercisesPage() {
  const list = await db
    .select({
      exercise: exercises,
      muscleGroup: muscleGroups,
    })
    .from(exercises)
    .leftJoin(muscleGroups, eq(exercises.muscleGroupId, muscleGroups.id))
    .where(
      or(isNull(exercises.userId), eq(exercises.userId, CURRENT_USER_ID))
    )
    .orderBy(exercises.name);

  const items = list.map(({ exercise, muscleGroup }) => ({
    id: exercise.id,
    name: exercise.name,
    difficulty: exercise.difficulty,
    isBodyweight: exercise.isBodyweight,
    muscleGroupName: muscleGroup?.name ?? null,
    equipment: exercise.equipment,
  }));

  return (
    <div className="bg-mesh min-h-screen px-4 pt-6 pb-8">
      <h1 className="mb-1 text-3xl font-extrabold tracking-tight">
        Exercises 💪
      </h1>
      <p className="mb-4 text-sm text-zinc-500">
        {items.length} movements · search or filter by muscle group
      </p>
      <ExerciseBrowser items={items} />
    </div>
  );
}
