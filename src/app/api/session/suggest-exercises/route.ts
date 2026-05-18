import { NextResponse } from "next/server";
import { suggestExercises } from "@/lib/services/suggest-exercises";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const planId = parseInt(searchParams.get("planId") ?? "", 10);
  const sessionId = parseInt(searchParams.get("sessionId") ?? "", 10);
  const userId = searchParams.get("userId")
    ? parseInt(searchParams.get("userId")!, 10)
    : undefined;

  if (Number.isNaN(planId) || Number.isNaN(sessionId)) {
    return NextResponse.json(
      { error: "planId and sessionId are required" },
      { status: 400 }
    );
  }

  const suggestions = await suggestExercises({ planId, sessionId, userId });
  return NextResponse.json({ suggestions });
}
