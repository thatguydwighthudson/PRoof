import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { programs, userPrograms, workoutReminders } from "@/lib/db/schema";

const DEFAULT_PROGRAM_NAME = "PPL 6-Day";

export async function enrollDefaultProgram(userId: number) {
  const [existing] = await db
    .select()
    .from(userPrograms)
    .where(
      and(eq(userPrograms.userId, userId), eq(userPrograms.isActive, true))
    )
    .limit(1);
  if (existing) return existing;

  const [program] = await db
    .select()
    .from(programs)
    .where(
      and(eq(programs.name, DEFAULT_PROGRAM_NAME), isNull(programs.userId))
    )
    .limit(1);
  if (!program) return null;

  const [enrollment] = await db
    .insert(userPrograms)
    .values({
      userId,
      programId: program.id,
      currentWeek: 1,
      nextDayNumber: 1,
      isActive: true,
    })
    .returning();

  const [reminder] = await db
    .select()
    .from(workoutReminders)
    .where(eq(workoutReminders.userId, userId))
    .limit(1);
  if (!reminder) {
    await db.insert(workoutReminders).values({
      userId,
      remindTime: "07:00",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      isActive: true,
    });
  }

  return enrollment;
}
