import { NextResponse } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { completionDateKey } from "@/lib/session-log-date";
import { db } from "@/lib/db";
import {
  workoutSessions,
  workoutPlans,
  sessionExercises,
  sessionSets,
  sessionCardio,
} from "@/lib/db/schema";
import { CURRENT_USER_ID } from "@/lib/config";

export async function GET() {
  const sessions = await db
    .select({
      session: workoutSessions,
      plan: workoutPlans,
    })
    .from(workoutSessions)
    .leftJoin(workoutPlans, eq(workoutSessions.planId, workoutPlans.id))
    .where(
      and(
        eq(workoutSessions.userId, CURRENT_USER_ID),
        isNotNull(workoutSessions.endedAt),
        eq(workoutSessions.isPreview, false)
      )
    )
    .orderBy(desc(workoutSessions.endedAt))
    .limit(100);

  const withCounts = await Promise.all(
    sessions.map(async ({ session, plan }) => {
      const exCount = await db
        .select()
        .from(sessionExercises)
        .where(eq(sessionExercises.sessionId, session.id));
      const cardio = await db
        .select()
        .from(sessionCardio)
        .where(eq(sessionCardio.sessionId, session.id));
      return {
        ...session,
        completedDate: completionDateKey(session.endedAt!),
        planName: plan?.name ?? "Workout",
        exerciseCount: exCount.length,
        cardioCount: cardio.length,
      };
    })
  );

  return NextResponse.json({ sessions: withCounts });
}
