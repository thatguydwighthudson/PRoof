import { NextResponse } from "next/server";
import { getSessionDetail } from "@/lib/services/session";
import { num } from "@/lib/db/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionDetail(parseInt(id, 10));
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...session,
    exercises: session.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({ ...s, weightKg: num(s.weightKg) })),
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
