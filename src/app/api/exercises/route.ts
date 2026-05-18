import { NextResponse } from "next/server";
import { eq, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, muscleGroups } from "@/lib/db/schema";
import { CURRENT_USER_ID } from "@/lib/config";

export async function GET() {
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
      or(isNull(exercises.userId), eq(exercises.userId, CURRENT_USER_ID))
    )
    .orderBy(exercises.name);

  return NextResponse.json({ exercises: list });
}
