import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { requireUserId } from "@/lib/services/user";

export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = await req.json();
  const endpoint = body.endpoint as string;
  const keys = body.keys as { p256dh: string; auth: string };

  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}
