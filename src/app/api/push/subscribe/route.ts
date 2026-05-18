import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { CURRENT_USER_ID } from "@/lib/config";

export async function POST(req: Request) {
  const body = await req.json();
  const endpoint = body.endpoint as string;
  const keys = body.keys as { p256dh: string; auth: string };

  await db
    .insert(pushSubscriptions)
    .values({
      userId: CURRENT_USER_ID,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}
