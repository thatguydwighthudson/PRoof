import { NextResponse } from "next/server";
import { reorderSessionExercises } from "@/lib/services/session";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  const body = await req.json();
  const orderedIds = body.orderedSessionExerciseIds as number[] | undefined;

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json(
      { error: "orderedSessionExerciseIds required" },
      { status: 400 }
    );
  }

  try {
    await reorderSessionExercises(sessionId, orderedIds);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
