import { NextResponse } from "next/server";
import { startSession, getActiveSessionOrNull } from "@/lib/services/session";
import { num } from "@/lib/db/schema";

function serializeSession(session: NonNullable<Awaited<ReturnType<typeof startSession>>>) {
  return {
    ...session,
    exercises: session.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({
        ...s,
        weightKg: num(s.weightKg),
      })),
      suggestion: ex.suggestion
        ? {
            ...ex.suggestion,
            lastWeightKg: num(ex.suggestion.lastWeightKg),
            suggestedWeightKg: num(ex.suggestion.suggestedWeightKg),
          }
        : null,
      lastPerformance: ex.lastPerformance
        ? {
            ...ex.lastPerformance,
            sets: ex.lastPerformance.sets.map((s) => ({
              ...s,
              weightKg: num(s.weightKg),
            })),
          }
        : null,
    })),
  };
}

export async function GET() {
  const active = await getActiveSessionOrNull();
  return NextResponse.json({ activeSessionId: active?.id ?? null });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const session = await startSession(body.planId);
  return NextResponse.json(serializeSession(session!));
}
