import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workoutReminders } from "@/lib/db/schema";
import { requireUserId } from "@/lib/services/user";

export async function GET() {
  const userId = await requireUserId();
  const [r] = await db
    .select()
    .from(workoutReminders)
    .where(eq(workoutReminders.userId, userId))
    .limit(1);
  return NextResponse.json(
    r ?? { remindTime: "07:00", isActive: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 7] }
  );
}

export async function PATCH(req: Request) {
  const userId = await requireUserId();
  const body = await req.json();
  const [existing] = await db
    .select()
    .from(workoutReminders)
    .where(eq(workoutReminders.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(workoutReminders)
      .set({
        remindTime: body.remindTime ?? existing.remindTime,
        isActive: body.isActive ?? existing.isActive,
      })
      .where(eq(workoutReminders.id, existing.id));
  }
  return NextResponse.json({ ok: true });
}
