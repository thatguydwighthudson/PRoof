import { NextResponse } from "next/server";
import { addWarmupSet } from "@/lib/services/session";
import { num } from "@/lib/db/schema";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const set = await addWarmupSet(body.sessionExerciseId);
  return NextResponse.json({ ...set, weightKg: num(set.weightKg) });
}
