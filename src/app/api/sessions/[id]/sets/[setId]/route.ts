import { NextResponse } from "next/server";
import { logSet, deleteSet } from "@/lib/services/session";
import { inputToKg } from "@/lib/units";
import { getPreferredUnit } from "@/lib/services/user";
import { db } from "@/lib/db";
import {
  sessionSets,
  sessionExercises,
  workoutSessions,
  num,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkSetForPr, getPersonalRecord } from "@/lib/services/pr";

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
      isPreview: workoutSessions.isPreview,
    })
    .from(sessionSets)
    .innerJoin(
      sessionExercises,
      eq(sessionSets.sessionExerciseId, sessionExercises.id)
    )
    .innerJoin(
      workoutSessions,
      eq(sessionExercises.sessionId, workoutSessions.id)
    )
    .where(eq(sessionSets.id, parseInt(setId, 10)))
    .limit(1);

  let prHit = null;
  if (body.isCompleted && row && !row.set.isWarmup && !row.isPreview) {
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId: setIdStr } = await params;
  const setId = parseInt(setIdStr, 10);

  if (Number.isNaN(setId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await deleteSet(setId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
