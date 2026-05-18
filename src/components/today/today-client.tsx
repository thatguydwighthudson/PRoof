"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TodayData = {
  userProgram: { currentWeek: number; nextDayNumber: number };
  program: { name: string; deloadWeekInterval: number };
  programDay: { label: string | null; restDay: boolean };
  plan: { id: number; name: string; description: string | null } | null;
  exercises: { exercise: { name: string }; planExercise: { defaultSets: number } }[];
  deload: boolean;
  rotationCount: number;
} | null;

export function TodayClient({
  initialToday,
  activeSessionId,
}: {
  initialToday: TodayData;
  activeSessionId: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const startWorkout = async () => {
    setLoading(true);
    try {
      if (activeSessionId) {
        router.push(`/workout/${activeSessionId}`);
        return;
      }
      const res = await fetch("/api/sessions", { method: "POST" });
      const data = await res.json();
      router.push(`/workout/${data.id}`);
    } finally {
      setLoading(false);
    }
  };

  if (!initialToday) {
    return (
      <Card>
        <p className="text-zinc-400">No active program. Check your database seed.</p>
      </Card>
    );
  }

  if (initialToday.programDay.restDay || !initialToday.plan) {
    return (
      <Card className="text-center">
        <p className="text-lg font-semibold text-emerald-400">Rest Day</p>
        <p className="mt-2 text-zinc-400">
          {initialToday.programDay.label ?? "Recovery"} — take it easy.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {initialToday.deload && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm font-medium text-amber-200">
          Deload Week — lighter weights &amp; sets
        </div>
      )}

      {initialToday.rotationCount > 0 && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-center text-xs text-zinc-400">
          Week {initialToday.userProgram.currentWeek} — {initialToday.rotationCount}{" "}
          exercise{initialToday.rotationCount > 1 ? "s" : ""} updated
        </div>
      )}

      <Card>
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Week {initialToday.userProgram.currentWeek} · Day{" "}
          {initialToday.userProgram.nextDayNumber}
        </p>
        <h2 className="mt-1 text-xl font-bold">{initialToday.plan.name}</h2>
        {initialToday.plan.description && (
          <p className="mt-2 text-sm text-zinc-400">{initialToday.plan.description}</p>
        )}
        <p className="mt-3 text-sm text-zinc-500">
          {initialToday.exercises.length} exercises
        </p>
        <ul className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
          {initialToday.exercises.slice(0, 5).map((e, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span>{e.exercise.name}</span>
              <span className="text-zinc-500">{e.planExercise.defaultSets} sets</span>
            </li>
          ))}
          {initialToday.exercises.length > 5 && (
            <li className="text-sm text-zinc-500">
              +{initialToday.exercises.length - 5} more
            </li>
          )}
        </ul>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={startWorkout}
        disabled={loading}
      >
        {activeSessionId ? (
          <>
            <RotateCcw className="h-5 w-5" /> Resume Workout
          </>
        ) : (
          <>
            <Play className="h-5 w-5" /> Start Workout
          </>
        )}
      </Button>
    </div>
  );
}
