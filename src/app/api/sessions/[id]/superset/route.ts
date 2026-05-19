import { NextResponse } from "next/server";
import { linkSuperset, unlinkFromSuperset } from "@/lib/services/session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  const body = await req.json();

  const anchorId = parseInt(body.anchorSessionExerciseId, 10);
  const partnerId = parseInt(body.partnerSessionExerciseId, 10);

  if (Number.isNaN(anchorId) || Number.isNaN(partnerId)) {
    return NextResponse.json(
      { error: "anchorSessionExerciseId and partnerSessionExerciseId required" },
      { status: 400 }
    );
  }

  try {
    const result = await linkSuperset(sessionId, anchorId, partnerId);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const sessionExerciseId = parseInt(body.sessionExerciseId, 10);

  if (Number.isNaN(sessionExerciseId)) {
    return NextResponse.json(
      { error: "sessionExerciseId required" },
      { status: 400 }
    );
  }

  try {
    await unlinkFromSuperset(sessionExerciseId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
