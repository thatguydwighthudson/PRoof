"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useUser } from "@/components/providers/user-provider";
import {
  displayWeight,
  displayWeightValue,
  formatWeightShort,
  inputToKg,
} from "@/lib/units";
import { PlateCalculator } from "@/components/workout/plate-calculator";
import { WorkoutCoach } from "@/components/workout/workout-coach";
import { cn, youtubeSearchUrl } from "@/lib/utils";

type SetRow = {
  id: number;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  isWarmup: boolean;
  isCompleted: boolean;
  rpe: number | null;
};

type ExerciseBlock = {
  id: number;
  exerciseId: number;
  sortOrder: number;
  notes: string | null;
  exercise: {
    id: number;
    name: string;
    isBodyweight: boolean;
    instructions: string | null;
    youtubeQuery: string | null;
  };
  sets: SetRow[];
  suggestion: {
    lastWeightKg: number;
    suggestedWeightKg: number;
  } | null;
  lastPerformance: {
    sessionDate: string;
    sets: SetRow[];
  } | null;
};

type SessionData = {
  id: number;
  isDeload: boolean;
  planId: number | null;
  exercises: ExerciseBlock[];
};

export function WorkoutSession({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const { preferredUnit } = useUser();
  const [session, setSession] = useState<SessionData | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [feel, setFeel] = useState(3);
  const [notes, setNotes] = useState("");
  const [plateOpen, setPlateOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [prFlash, setPrFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (res.ok) setSession(await res.json());
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (restSeconds == null || restSeconds <= 0) return;
    const t = setInterval(() => {
      setRestSeconds((s) => {
        if (s == null || s <= 1) {
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(200);
          }
          return null;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [restSeconds]);

  const current = session?.exercises[exerciseIndex];

  const updateSet = async (
    setId: number,
    patch: Record<string, unknown>
  ) => {
    const res = await fetch(`/api/sessions/${sessionId}/sets/${setId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.prHit) {
      const parts = [];
      if (data.prHit.isWeightPr) parts.push("weight");
      if (data.prHit.isRepsPr) parts.push("reps");
      if (data.prHit.isVolumePr) parts.push("volume");
      setPrFlash(parts.join(" & "));
      toast.success("🏆 New PR!", { description: parts.join(", ") });
      setTimeout(() => setPrFlash(null), 3000);
    }
    await load();
    if (patch.isCompleted) setRestSeconds(90);
  };

  const addWarmup = async () => {
    if (!current) return;
    await fetch(`/api/sessions/${sessionId}/warmup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionExerciseId: current.id }),
    });
    await load();
  };

  const finishSession = async () => {
    await fetch(`/api/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionNotes: notes, overallFeel: feel }),
    });
    router.push("/today");
    toast.success("Workout complete!");
  };

  const workingSets = useMemo(
    () => current?.sets.filter((s) => !s.isWarmup) ?? [],
    [current]
  );
  const warmupSets = useMemo(
    () => current?.sets.filter((s) => s.isWarmup) ?? [],
    [current]
  );

  if (!session || !current) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-zinc-500">
        Loading workout…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-4 pb-8 pt-4">
      {session.isDeload && (
        <div className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 py-2 text-center text-sm text-amber-200">
          Deload Week
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/today")}>
          <ChevronLeft className="h-4 w-4" /> Exit
        </Button>
        <span className="text-sm text-zinc-500">
          {exerciseIndex + 1} / {session.exercises.length}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setCoachOpen(true)}>
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>

      <h1 className="text-xl font-bold">{current.exercise.name}</h1>
      {current.suggestion && (
        <p className="mt-1 text-xs text-emerald-400">
          ↑ Suggested: {formatWeightShort(current.suggestion.suggestedWeightKg, preferredUnit)}{" "}
          (was {formatWeightShort(current.suggestion.lastWeightKg, preferredUnit)})
        </p>
      )}
      {prFlash && (
        <p className="mt-1 animate-pulse text-sm font-semibold text-amber-400">
          🏆 PR — {prFlash}
        </p>
      )}

      {current.lastPerformance && (
        <p className="mt-2 text-xs text-zinc-500">
          Last:{" "}
          {current.lastPerformance.sets
            .map(
              (s) =>
                `${s.reps ?? "?"}×${displayWeightValue(s.weightKg, preferredUnit) ?? "BW"}`
            )
            .join(", ")}
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-fit"
        onClick={addWarmup}
      >
        <Plus className="h-4 w-4" /> Add Warm-up Set
      </Button>

      <div className="mt-4 flex-1 space-y-2">
        {[...warmupSets, ...workingSets].map((set) => (
          <SetCard
            key={set.id}
            set={set}
            isBodyweight={current.exercise.isBodyweight}
            preferredUnit={preferredUnit}
            onUpdate={updateSet}
            onPlate={() => setPlateOpen(true)}
          />
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={exerciseIndex === 0}
          onClick={() => setExerciseIndex((i) => i - 1)}
        >
          <ChevronLeft /> Prev
        </Button>
        {exerciseIndex < session.exercises.length - 1 ? (
          <Button
            className="flex-1"
            onClick={() => setExerciseIndex((i) => i + 1)}
          >
            Next <ChevronRight />
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => setShowComplete(true)}>
            Finish
          </Button>
        )}
      </div>

      {restSeconds != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
          <div className="text-center">
            <p className="text-sm uppercase tracking-widest text-zinc-400">Rest</p>
            <p className="text-8xl font-bold tabular-nums text-emerald-400">
              {restSeconds}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setRestSeconds(null)}
            >
              <SkipForward className="h-4 w-4" /> Skip
            </Button>
          </div>
        </div>
      )}

      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70">
          <Card className="w-full rounded-b-none rounded-t-3xl p-6">
            <h2 className="text-lg font-bold">How did it feel?</h2>
            <div className="my-4 flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFeel(n)}
                  className={cn(
                    "flex h-12 flex-1 items-center justify-center rounded-xl text-lg font-bold",
                    feel === n
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-800 text-zinc-400"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <Input
              placeholder="Session notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mb-4"
            />
            <Button className="w-full" onClick={finishSession}>
              Complete Workout
            </Button>
          </Card>
        </div>
      )}

      <PlateCalculator open={plateOpen} onClose={() => setPlateOpen(false)} />
      {coachOpen && (
        <WorkoutCoach
          session={session}
          exercise={current}
          onClose={() => setCoachOpen(false)}
        />
      )}
    </div>
  );
}

function SetCard({
  set,
  isBodyweight,
  preferredUnit,
  onUpdate,
  onPlate,
}: {
  set: SetRow;
  isBodyweight: boolean;
  preferredUnit: "lbs" | "kg";
  onUpdate: (id: number, patch: Record<string, unknown>) => void;
  onPlate: () => void;
}) {
  const display =
    set.weightKg != null ? displayWeightValue(set.weightKg, preferredUnit) : "";

  return (
    <Card
      className={cn(
        "flex flex-wrap items-center gap-2",
        set.isWarmup && "border-zinc-700/50 bg-zinc-900/50 opacity-80"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
          set.isWarmup ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800"
        )}
      >
        {set.isWarmup ? "W" : set.setNumber}
      </span>
      <Input
        type="number"
        inputMode="decimal"
        placeholder="Reps"
        className="h-11 w-16"
        defaultValue={set.reps ?? ""}
        onBlur={(e) =>
          onUpdate(set.id, { reps: parseInt(e.target.value, 10) || null })
        }
      />
      {(!isBodyweight || set.weightKg) && (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            inputMode="decimal"
            step="0.5"
            placeholder={preferredUnit}
            className="h-11 w-20"
            defaultValue={display ?? ""}
            onBlur={(e) =>
              onUpdate(set.id, {
                weightDisplay: parseFloat(e.target.value) || null,
              })
            }
          />
          <button
            type="button"
            onClick={onPlate}
            className="text-zinc-500 hover:text-emerald-400"
            aria-label="Plate calculator"
          >
            <Calculator className="h-4 w-4" />
          </button>
        </div>
      )}
      <Input
        type="number"
        inputMode="numeric"
        placeholder="RPE"
        className="h-11 w-14"
        min={1}
        max={10}
        defaultValue={set.rpe ?? ""}
        onBlur={(e) =>
          onUpdate(set.id, {
            rpe: parseInt(e.target.value, 10) || null,
          })
        }
      />
      <Button
        size="sm"
        variant={set.isCompleted ? "secondary" : "default"}
        onClick={() => onUpdate(set.id, { isCompleted: !set.isCompleted })}
      >
        {set.isCompleted ? "✓" : "Log"}
      </Button>
    </Card>
  );
}
