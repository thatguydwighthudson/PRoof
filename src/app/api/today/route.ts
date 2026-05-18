import { NextResponse } from "next/server";
import { getTodayPlan } from "@/lib/services/program";
import { getActiveSessionOrNull } from "@/lib/services/session";
import { num } from "@/lib/db/schema";

export async function GET() {
  const today = await getTodayPlan();
  const activeSession = await getActiveSessionOrNull();

  if (!today) {
    return NextResponse.json({ today: null, activeSession: null });
  }

  return NextResponse.json({
    today: {
      ...today,
      exercises: today.exercises.map((e) => ({
        ...e,
        planExercise: {
          ...e.planExercise,
          defaultWeight: num(e.planExercise.defaultWeight),
        },
      })),
    },
    activeSession: activeSession
      ? { id: activeSession.id, planId: activeSession.planId }
      : null,
  });
}
