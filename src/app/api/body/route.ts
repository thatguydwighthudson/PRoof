import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { bodyMetrics, num } from "@/lib/db/schema";
import { CURRENT_USER_ID } from "@/lib/config";

export async function GET() {
  const rows = await db
    .select()
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, CURRENT_USER_ID))
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
  const { weightKg } = await req.json();
  await db
    .insert(bodyMetrics)
    .values({
      userId: CURRENT_USER_ID,
      weightKg: String(weightKg),
    })
    .onConflictDoUpdate({
      target: [bodyMetrics.userId, bodyMetrics.loggedDate],
      set: { weightKg: String(weightKg) },
    });
  return NextResponse.json({ ok: true });
}
