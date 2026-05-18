import { NextResponse } from "next/server";
import {
  removeSessionExerciseOnly,
  removeExerciseFromPlanPermanently,
} from "@/lib/services/session";

export async function DELETE(
  req: Request,
  {
    params,
  }: { params: Promise<{ id: string; sessionExerciseId: string }> }
) {
  const { id, sessionExerciseId: seId } = await params;
  const sessionId = parseInt(id, 10);
  const sessionExerciseId = parseInt(seId, 10);

  if (Number.isNaN(sessionId) || Number.isNaN(sessionExerciseId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const scope = body.scope === "plan" ? "plan" : "session";

  try {
    if (scope === "plan") {
      const { planName } = await removeExerciseFromPlanPermanently(
        sessionId,
        sessionExerciseId
      );
      return NextResponse.json({ scope: "plan", planName });
    }

    await removeSessionExerciseOnly(sessionId, sessionExerciseId);
    return NextResponse.json({ scope: "session" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
