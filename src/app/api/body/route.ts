import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { bodyMetrics, num } from "@/lib/db/schema";
import { requireUserId } from "@/lib/services/user";

export async function GET() {
  const userId = await requireUserId();
  const rows = await db
    .select()
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(desc(bodyMetrics.loggedDate))
    .limit(52);

  return NextResponse.json({
    metrics: rows.map((r) => ({
      loggedDate: r.loggedDate,
      weightKg: num(r.weightKg),
    })),
  });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  const { weightKg } = await req.json();
  await db
    .insert(bodyMetrics)
    .values({
      userId,
      weightKg: String(weightKg),
    })
    .onConflictDoUpdate({
      target: [bodyMetrics.userId, bodyMetrics.loggedDate],
      set: { weightKg: String(weightKg) },
    });
  return NextResponse.json({ ok: true });
}
