import { NextResponse } from "next/server";
import { addWorkingSet } from "@/lib/services/session";
import { num } from "@/lib/db/schema";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const sessionExerciseId = parseInt(body.sessionExerciseId, 10);

  if (Number.isNaN(sessionExerciseId)) {
    return NextResponse.json(
      { error: "sessionExerciseId required" },
      { status: 400 }
    );
  }

  try {
    const set = await addWorkingSet(sessionExerciseId);
    return NextResponse.json({ ...set, weightKg: num(set.weightKg) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
