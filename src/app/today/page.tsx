export const dynamic = "force-dynamic";

import Link from "next/link";
import { Settings } from "lucide-react";
import { TodayClient } from "@/components/today/today-client";
import { getTodayPlan, getNextWorkoutPreview } from "@/lib/services/program";
import {
  getActiveSessionOrNull,
  getExercisePreviewsForToday,
} from "@/lib/services/session";
import { getAuthenticatedUser } from "@/lib/auth";
import { timeOfDayGreeting, userInitials } from "@/lib/greeting";

export default async function TodayPage() {
  const user = await getAuthenticatedUser();

  const today = await getTodayPlan();
  const nextWorkout = await getNextWorkoutPreview();
  const active = await getActiveSessionOrNull();
  const exercisePreviews =
    today && !today.programDay.restDay && today.plan
      ? await getExercisePreviewsForToday(today.exercises, today.deload)
      : [];

  return (
    <div className="bg-mesh min-h-screen px-4 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            PRoof
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {user ? timeOfDayGreeting(user.name) : "Today 🏋️"}
          </h1>
        </div>
        <Link
          href="/settings"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900/80 text-sm font-bold text-emerald-400 ring-1 ring-zinc-800 transition hover:text-emerald-300"
          aria-label="Settings"
          title={user?.name}
        >
          {user ? userInitials(user.name) : <Settings className="h-5 w-5" />}
        </Link>
      </header>
      <TodayClient
        initialToday={today}
        nextWorkout={nextWorkout}
        activeSessionId={active?.id ?? null}
        activeIsPreview={active?.isPreview ?? false}
        exercisePreviews={exercisePreviews}
      />
    </div>
  );
}
