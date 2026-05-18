import { NextResponse } from "next/server";
import { logSet } from "@/lib/services/session";
import { inputToKg } from "@/lib/units";
import { getPreferredUnit } from "@/lib/services/user";
import { db } from "@/lib/db";
import { sessionSets, sessionExercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkSetForPr, getPersonalRecord } from "@/lib/services/pr";
import { num } from "@/lib/db/schema";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const body = await req.json();
  const unit = await getPreferredUnit();

  let weightKg = body.weightKg;
  if (body.weightDisplay != null) {
    weightKg = inputToKg(parseFloat(body.weightDisplay), unit);
  }

  await logSet(parseInt(setId, 10), {
    reps: body.reps,
    weightKg,
    rpe: body.rpe,
    isCompleted: body.isCompleted,
  });

  const [row] = await db
    .select({
      set: sessionSets,
      exerciseId: sessionExercises.exerciseId,
    })
    .from(sessionSets)
    .innerJoin(sessionExercises, eq(sessionSets.sessionExerciseId, sessionExercises.id))
    .where(eq(sessionSets.id, parseInt(setId, 10)))
    .limit(1);

  let prHit = null;
  if (body.isCompleted && row && !row.set.isWarmup) {
    const pr = await getPersonalRecord(row.exerciseId);
    const w = weightKg ?? num(row.set.weightKg);
    const r = body.reps ?? row.set.reps;
    const check = checkSetForPr(w, r, pr);
    if (check.isWeightPr || check.isRepsPr || check.isVolumePr) {
      prHit = check;
    }
  }

  const [updated] = await db
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.id, parseInt(setId, 10)))
    .limit(1);

  return NextResponse.json({
    set: { ...updated, weightKg: num(updated.weightKg) },
    prHit,
  });
}
