import { NextResponse } from "next/server";
import { eq, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, muscleGroups } from "@/lib/db/schema";
import { requireUserId } from "@/lib/services/user";

export async function GET() {
  const userId = await requireUserId();
  const list = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      difficulty: exercises.difficulty,
      equipment: exercises.equipment,
      youtubeQuery: exercises.youtubeQuery,
      muscleGroupName: muscleGroups.name,
    })
    .from(exercises)
    .leftJoin(muscleGroups, eq(exercises.muscleGroupId, muscleGroups.id))
    .where(
      or(isNull(exercises.userId), eq(exercises.userId, userId))
    )
    .orderBy(exercises.name);

  return NextResponse.json({ exercises: list });
}
