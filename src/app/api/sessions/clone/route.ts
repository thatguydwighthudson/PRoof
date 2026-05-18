import { NextResponse } from "next/server";
import { cloneSession } from "@/lib/services/session";
import { num } from "@/lib/db/schema";

export async function POST(req: Request) {
  const { sourceSessionId } = await req.json();
  const session = await cloneSession(sourceSessionId);
  return NextResponse.json({
    id: session?.id,
    exercises: session?.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({ ...s, weightKg: num(s.weightKg) })),
    })),
  });
}
