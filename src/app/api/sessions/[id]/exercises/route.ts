import { NextResponse } from "next/server";
import {
  addSessionExercise,
  addExerciseToPlanPermanently,
} from "@/lib/services/session";
import { num } from "@/lib/db/schema";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  const body = await req.json();
  const exerciseId = parseInt(body.exerciseId, 10);

  if (Number.isNaN(exerciseId)) {
    return NextResponse.json({ error: "exerciseId required" }, { status: 400 });
  }

  const scope = body.scope === "plan" ? "plan" : "session";

  try {
    const result =
      scope === "plan"
        ? await addExerciseToPlanPermanently(sessionId, exerciseId)
        : await addSessionExercise(sessionId, exerciseId);
    const ex = result.sessionExercise;
    if (!ex) {
      return NextResponse.json({ error: "Failed to add" }, { status: 500 });
    }

    return NextResponse.json({
      scope,
      planName: "planName" in result ? result.planName : undefined,
      defaultRestSeconds: result.defaultRestSeconds,
      exercise: {
        ...ex,
        sets: ex.sets.map((s) => ({ ...s, weightKg: num(s.weightKg) })),
        suggestion: ex.suggestion
          ? {
              ...ex.suggestion,
              lastWeightKg: num(ex.suggestion.lastWeightKg),
              suggestedWeightKg: num(ex.suggestion.suggestedWeightKg),
            }
          : null,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    const status = message.includes("already") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
