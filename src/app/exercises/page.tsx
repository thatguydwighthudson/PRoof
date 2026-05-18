export const dynamic = "force-dynamic";

import { eq, or, isNull } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { exercises, muscleGroups } from "@/lib/db/schema";
import { CURRENT_USER_ID } from "@/lib/config";
import { Card } from "@/components/ui/card";

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

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold">Exercises</h1>
      <div className="space-y-2">
        {list.map(({ exercise, muscleGroup }) => (
          <Link key={exercise.id} href={`/exercises/${exercise.id}`}>
            <Card className="transition-colors hover:border-zinc-600">
              <p className="font-medium">{exercise.name}</p>
              <p className="text-xs text-zinc-500">
                {muscleGroup?.name ?? "—"}
                {exercise.isBodyweight ? " · Bodyweight" : ""}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
