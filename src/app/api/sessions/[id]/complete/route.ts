import { NextResponse } from "next/server";
import { completeSession, getSessionDetail } from "@/lib/services/session";
import { num } from "@/lib/db/schema";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  await completeSession(parseInt(id, 10), {
    sessionNotes: body.sessionNotes,
    overallFeel: body.overallFeel,
  });
  const session = await getSessionDetail(parseInt(id, 10));
  return NextResponse.json({
    ...session,
    exercises: session?.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({ ...s, weightKg: num(s.weightKg) })),
    })),
  });
}
