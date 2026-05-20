import { NextResponse } from "next/server";
import webpush from "web-push";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  pushSubscriptions,
  workoutReminders,
  userPrograms,
  programDays,
  workoutPlans,
} from "@/lib/db/schema";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "VAPID not configured" }, { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@proof.app",
    publicKey,
    privateKey
  );

  const activeReminders = await db
    .select()
    .from(workoutReminders)
    .where(eq(workoutReminders.isActive, true));

  let sent = 0;

  for (const reminder of activeReminders) {
    const [up] = await db
      .select()
      .from(userPrograms)
      .where(
        and(
          eq(userPrograms.userId, reminder.userId),
          eq(userPrograms.isActive, true)
        )
      )
      .limit(1);

    let title = "Your workout is ready";
    if (up) {
      const [day] = await db
        .select({ label: programDays.label, plan: workoutPlans })
        .from(programDays)
        .leftJoin(workoutPlans, eq(programDays.planId, workoutPlans.id))
        .where(
          and(
            eq(programDays.programId, up.programId),
            eq(programDays.dayNumber, up.nextDayNumber)
          )
        )
        .limit(1);
      const name = day?.label ?? day?.plan?.name ?? "workout";
      title = `Your ${name} workout is ready`;
    }

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, reminder.userId));

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title, body: "Time to train 💪" })
        );
        sent++;
      } catch {
        /* subscription expired */
      }
    }
  }

  return NextResponse.json({ sent });
}
