import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionDetail } from "@/lib/services/session";
import { db } from "@/lib/db";
import { num, workoutPlans } from "@/lib/db/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  const session = await getSessionDetail(sessionId);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let planName: string | null = null;
  if (session.planId) {
    const [plan] = await db
      .select({ name: workoutPlans.name })
      .from(workoutPlans)
      .where(eq(workoutPlans.id, session.planId))
      .limit(1);
    planName = plan?.name ?? null;
  }

  return NextResponse.json({
    ...session,
    planName,
    exercises: session.exercises.map((ex) => ({
      ...ex,
      supersetGroupId: ex.supersetGroupId ?? null,
      muscleGroup: ex.muscleGroup ? { name: ex.muscleGroup.name } : null,
      sets: ex.sets.map((s) => ({ ...s, weightKg: num(s.weightKg) })),
      lastPerformance: ex.lastPerformance
        ? {
            ...ex.lastPerformance,
            sets: ex.lastPerformance.sets.map((s) => ({
              ...s,
              weightKg: num(s.weightKg),
            })),
            typical: ex.lastPerformance.typical
              ? {
                  ...ex.lastPerformance.typical,
                  weightKg: ex.lastPerformance.typical.weightKg,
                }
              : null,
          }
        : null,
      suggestion: ex.suggestion
        ? {
            ...ex.suggestion,
            lastWeightKg: num(ex.suggestion.lastWeightKg),
            suggestedWeightKg: num(ex.suggestion.suggestedWeightKg),
          }
        : null,
    })),
  });
}
