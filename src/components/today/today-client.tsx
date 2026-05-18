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
  const restQuote = useMemo(() => randomRestQuote(), []);

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

  return (
    <div className="space-y-4">
      <StreakCard />

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
          "shadow-xl"
        )}
      >
        <SectionLabel>
          Week {initialToday.userProgram.currentWeek} · Day{" "}
          {initialToday.userProgram.nextDayNumber}
        </SectionLabel>
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
        <ul className="mt-4 space-y-2 border-t border-zinc-800/80 pt-4">
          {initialToday.exercises.slice(0, 5).map((e, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-zinc-200">{e.exercise.name}</span>
              <span className="font-bold tabular-nums text-zinc-500">
                {e.planExercise.defaultSets} sets
              </span>
            </li>
          ))}
          {initialToday.exercises.length > 5 && (
            <li className="text-sm text-zinc-500">
              +{initialToday.exercises.length - 5} more
            </li>
          )}
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
