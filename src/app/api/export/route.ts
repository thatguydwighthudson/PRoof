import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  workoutSessions,
  sessionExercises,
  sessionSets,
  sessionCardio,
  bodyMetrics,
} from "@/lib/db/schema";
import { requireUserId } from "@/lib/services/user";

export async function GET(req: Request) {
  const userId = await requireUserId();
  const format = new URL(req.url).searchParams.get("format") ?? "json";

  const sessions = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, userId))
    .orderBy(desc(workoutSessions.sessionDate));

  const full = await Promise.all(
    sessions.map(async (s) => {
      const exercises = await db
        .select()
        .from(sessionExercises)
        .where(eq(sessionExercises.sessionId, s.id));
      const sets = await Promise.all(
        exercises.map(async (ex) => {
          const rows = await db
            .select()
            .from(sessionSets)
            .where(eq(sessionSets.sessionExerciseId, ex.id));
          return { ...ex, sets: rows };
        })
      );
      const cardio = await db
        .select()
        .from(sessionCardio)
        .where(eq(sessionCardio.sessionId, s.id));
      return { ...s, exercises: sets, cardio };
    })
  );

  const metrics = await db
    .select()
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId));

  if (format === "csv") {
    const header = "id,date,plan_id,duration_mins,is_deload,feel\n";
    const rows = sessions
      .map(
        (s) =>
          `${s.id},${s.sessionDate},${s.planId ?? ""},${s.durationMins ?? ""},${s.isDeload},${s.overallFeel ?? ""}`
      )
      .join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="sessions.csv"',
      },
    });
  }

  return new NextResponse(
    JSON.stringify({ sessions: full, bodyMetrics: metrics }, null, 2),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="proof-export.json"',
      },
    }
  );
}
