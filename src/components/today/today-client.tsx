"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { StreakCard } from "@/components/today/streak-card";
import {
  getPlanTheme,
  randomRestQuote,
} from "@/lib/ui/plan-theme";
import { cn } from "@/lib/utils";
import type { ResolvedSetDefaults } from "@/lib/workout/set-defaults";
import { useUser } from "@/components/providers/user-provider";
import { formatWeightShort } from "@/lib/units";

type TodayData = {
  userProgram: { currentWeek: number; nextDayNumber: number };
  program: { name: string; deloadWeekInterval: number };
  programDay: { label: string | null; restDay: boolean };
  plan: { id: number; name: string; description: string | null } | null;
  exercises: {
    exercise: { id: number; name: string };
    planExercise: { defaultSets: number; defaultReps: string };
  }[];
  deload: boolean;
  rotationCount: number;
} | null;

type NextWorkoutData = {
  completedToday: boolean;
  week: number;
  dayNumber: number;
  programDay: { label: string | null; restDay: boolean };
  plan: { id: number; name: string; description: string | null } | null;
  deload: boolean;
  nextDate: string;
} | null;

export function TodayClient({
  initialToday,
  nextWorkout,
  activeSessionId,
  exercisePreviews,
}: {
  initialToday: TodayData;
  nextWorkout: NextWorkoutData;
  activeSessionId: number | null;
  exercisePreviews: (ResolvedSetDefaults & { exerciseId: number })[];
}) {
  const router = useRouter();
  const { preferredUnit } = useUser();
  const [loading, setLoading] = useState(false);
  const restQuote = useMemo(() => randomRestQuote(), []);
  const previewByExerciseId = useMemo(
    () => new Map(exercisePreviews.map((p) => [p.exerciseId, p])),
    [exercisePreviews]
  );

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

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
      <div className="space-y-4">
        <StreakCard />
        <Card className="relative overflow-hidden border-teal-500/30 bg-gradient-to-b from-teal-500/10 to-zinc-900 py-12 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.15),transparent_60%)]" />
          <span className="text-6xl">🛋️</span>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-teal-100">
            Rest Day
          </h2>
          <p className="mt-2 text-sm font-medium text-teal-200/80">
            You earned it
          </p>
          <p className="mx-auto mt-6 max-w-xs text-sm italic text-zinc-400">
            &ldquo;{restQuote}&rdquo;
          </p>
          <p className="mt-4 text-xs text-zinc-500">
            {initialToday.programDay.label ?? "Active Recovery"}
          </p>
        </Card>
      </div>
    );
  }

  const theme = getPlanTheme(initialToday.plan.name);
  const showNextWorkout =
    nextWorkout?.completedToday &&
    nextWorkout.plan != null &&
    !nextWorkout.programDay.restDay;

  return (
    <div className="space-y-4">
      <StreakCard />

      {showNextWorkout && nextWorkout.plan && (
        <Card className="border-l-4 border-l-sky-500/60 bg-sky-950/20 pl-5">
          <SectionLabel>Next workout</SectionLabel>
          <p className="mt-1 text-xs font-medium text-sky-300/90">
            {nextWorkout.nextDate}
          </p>
          <div className="mt-3 flex items-start gap-2">
            <span className="text-2xl">
              {getPlanTheme(nextWorkout.plan.name).emoji}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold tracking-tight text-zinc-50">
                {nextWorkout.plan.name}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Week {nextWorkout.week} · Day {nextWorkout.dayNumber}
                {nextWorkout.programDay.label
                  ? ` · ${nextWorkout.programDay.label}`
                  : ""}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            Today&apos;s workout is done. Rest up — you&apos;re on track.
          </p>
        </Card>
      )}

      {initialToday.deload && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm font-semibold text-amber-100">
          😴 Deload Week — Recovery is progress
        </div>
      )}

      {initialToday.rotationCount > 0 && (
        <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-2 text-center text-xs font-medium text-zinc-400">
          Week {initialToday.userProgram.currentWeek} — {initialToday.rotationCount}{" "}
          exercise{initialToday.rotationCount > 1 ? "s" : ""} updated
        </div>
      )}

      <Card
        className={cn(
          "border-l-4 pl-5",
          theme.border,
          theme.glow,
          "shadow-xl",
          showNextWorkout && "opacity-75"
        )}
      >
        <SectionLabel>
          {showNextWorkout ? "Today's workout" : "Today's workout"} · Week{" "}
          {initialToday.userProgram.currentWeek} · Day{" "}
          {initialToday.userProgram.nextDayNumber}
        </SectionLabel>
        {showNextWorkout && (
          <p className="mt-1 text-xs font-semibold text-emerald-400">Completed ✓</p>
        )}
        <p className="mt-2 text-xs text-zinc-500">{todayLabel}</p>
        <div className="mt-3 flex items-start gap-2">
          <span className="text-3xl">{theme.emoji}</span>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
              {initialToday.plan.name}
            </h2>
            <p className="mt-1 text-sm font-medium text-emerald-400/90">
              Let&apos;s get to work 🔥
            </p>
          </div>
        </div>
        {initialToday.plan.description && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {initialToday.plan.description}
          </p>
        )}
        <p className="mt-4 text-sm font-semibold text-zinc-300">
          <span className="text-2xl font-black text-zinc-50">
            {initialToday.exercises.length}
          </span>{" "}
          <span className="text-zinc-500">exercises</span>
        </p>
        <ul className="mt-4 max-h-52 space-y-2 overflow-y-auto overscroll-contain border-t border-zinc-800/80 pt-4 pr-1">
          {initialToday.exercises.map((e, i) => {
            const preview = previewByExerciseId.get(e.exercise.id);
            const setLabel = preview
              ? `${preview.setCount}×${preview.repsLabel}`
              : `${e.planExercise.defaultSets}×${e.planExercise.defaultReps}`;
            const weightLabel =
              preview?.weightKg != null
                ? formatWeightShort(preview.weightKg, preferredUnit)
                : null;
            return (
              <li key={i} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 break-words text-zinc-200">
                  {e.exercise.name}
                </span>
                <span className="shrink-0 text-right font-bold tabular-nums text-zinc-500">
                  {setLabel}
                  {weightLabel && (
                    <span className="block text-[11px] font-semibold text-zinc-600">
                      @ {weightLabel}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          className={cn(
            "h-16 w-full text-lg font-extrabold shadow-lg shadow-emerald-600/30",
            "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500"
          )}
          size="lg"
          onClick={startWorkout}
          disabled={loading}
        >
          {activeSessionId ? (
            <>
              <RotateCcw className="h-6 w-6" /> Resume Workout 🔄
            </>
          ) : (
            <>Start Workout 🔥</>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
