"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Info,
  Link2,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { useUser } from "@/components/providers/user-provider";
import { displayWeightValue, formatWeightShort } from "@/lib/units";
import { FEEL_EMOJIS, feelLabel } from "@/lib/ui/feel";
import { PlateCalculator } from "@/components/workout/plate-calculator";
import { WorkoutCoach } from "@/components/workout/workout-coach";
import { RestTimerOverlay } from "@/components/workout/rest-timer-overlay";
import { RestTimerMinimized } from "@/components/workout/rest-timer-minimized";
import { WearableNotice } from "@/components/workout/wearable-notice";
import {
  getExerciseProgress,
  progressLabel,
} from "@/lib/workout/exercise-progress";
import { youtubeSearchUrl } from "@/lib/utils";
import { PrBanner } from "@/components/workout/pr-banner";
import { AddExerciseSheet } from "@/components/workout/add-exercise-sheet";
import {
  RemoveExerciseSheet,
  type RemoveExerciseTarget,
} from "@/components/workout/remove-exercise-sheet";
import {
  SupersetSheet,
  type SupersetSheetTarget,
} from "@/components/workout/superset-sheet";
import { cn } from "@/lib/utils";

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
  supersetGroupId: number | null;
  notes: string | null;
  isUserAdded?: boolean;
  exercise: {
    id: number;
    name: string;
    isBodyweight: boolean;
    equipment: string | null;
    instructions: string | null;
    youtubeQuery: string | null;
  };
  muscleGroup: { name: string } | null;
  sets: SetRow[];
  suggestion: {
    lastWeightKg: number;
    suggestedWeightKg: number;
  } | null;
  lastPerformance: {
    sessionDate: string;
    sets: SetRow[];
    typical: { reps: number | null; weightKg: number | null } | null;
  } | null;
};

type SessionData = {
  id: number;
  isDeload: boolean;
  planId: number | null;
  planName: string | null;
  exercises: ExerciseBlock[];
};

const REST_DEFAULT = 90;

export function WorkoutSession({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const { preferredUnit } = useUser();
  const [session, setSession] = useState<SessionData | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(REST_DEFAULT);
  const [showComplete, setShowComplete] = useState(false);
  const [feel, setFeel] = useState(3);
  const [notes, setNotes] = useState("");
  const [plateOpen, setPlateOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [prDetail, setPrDetail] = useState<string | null>(null);
  const [cardioOpen, setCardioOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<RemoveExerciseTarget | null>(
    null
  );
  const [restByExerciseId, setRestByExerciseId] = useState<Record<number, number>>(
    {}
  );
  const [restMinimized, setRestMinimized] = useState(false);
  const [showExerciseInfo, setShowExerciseInfo] = useState(false);
  const [showWearableNotice, setShowWearableNotice] = useState(false);
  const [supersetTarget, setSupersetTarget] = useState<SupersetSheetTarget | null>(
    null
  );

  const load = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (res.ok) setSession(await res.json());
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!session) return;
    const key = `proof-wearable-${sessionId}`;
    if (sessionStorage.getItem(key)) return;
    setShowWearableNotice(true);
    sessionStorage.setItem(key, "1");
  }, [session, sessionId]);

  useEffect(() => {
    if (restSeconds == null || restSeconds <= 0) return;
    const t = setInterval(() => {
      setRestSeconds((s) => {
        if (s == null || s <= 1) {
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
          return null;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [restSeconds]);

  const current = session?.exercises[exerciseIndex];
  const progress =
    session && session.exercises.length > 0
      ? ((exerciseIndex + 1) / session.exercises.length) * 100
      : 0;

  const firstIncompleteId = useMemo(() => {
    if (!current) return null;
    const all = [...current.sets].sort((a, b) => a.setNumber - b.setNumber);
    return all.find((s) => !s.isCompleted)?.id ?? null;
  }, [current]);

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
      setPrDetail(parts.join(" & "));
    }
    await load();

    if (patch.isCompleted && current && session) {
      const groupId = current.supersetGroupId;
      if (groupId != null) {
        const partners = session.exercises.filter(
          (e) => e.supersetGroupId === groupId && e.id !== current.id
        );
        const partnerNeedsWork = partners.some((p) =>
          p.sets.some((s) => !s.isCompleted)
        );
        if (partnerNeedsWork) {
          const nextPartner = partners.find((p) =>
            p.sets.some((s) => !s.isCompleted)
          );
          if (nextPartner) {
            const idx = session.exercises.findIndex((e) => e.id === nextPartner.id);
            if (idx >= 0) setExerciseIndex(idx);
            return;
          }
        }
      }

      const rest = restByExerciseId[current.id] ?? REST_DEFAULT;
      setRestTotal(rest);
      setRestSeconds(rest);
      setRestMinimized(false);
    }
  };

  const deleteSet = async (setId: number) => {
    await fetch(`/api/sessions/${sessionId}/sets/${setId}`, {
      method: "DELETE",
    });
    await load();
  };

  const moveExercise = async (index: number, direction: -1 | 1) => {
    if (!session) return;
    const target = index + direction;
    if (target < 0 || target >= session.exercises.length) return;

    const reordered = [...session.exercises];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    await fetch(`/api/sessions/${sessionId}/exercises/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderedSessionExerciseIds: reordered.map((e) => e.id),
      }),
    });
    await load();
    if (exerciseIndex === index) setExerciseIndex(target);
    else if (exerciseIndex === target) setExerciseIndex(index);
  };

  const openSupersetSheet = () => {
    if (!current) return;
    setSupersetTarget({
      sessionExerciseId: current.id,
      exerciseName: current.exercise.name,
      supersetGroupId: current.supersetGroupId,
    });
  };

  const addWorkingSet = async () => {
    if (!current) return;
    await fetch(`/api/sessions/${sessionId}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionExerciseId: current.id }),
    });
    await load();
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

  const loggedSetCount = (ex: ExerciseBlock) =>
    ex.sets.filter((s) => s.isCompleted).length;

  const handleExerciseRemoved = (
    sessionExerciseId: number,
    scope: "session" | "plan",
    planName?: string
  ) => {
    if (!session) return;

    const removedIndex = session.exercises.findIndex(
      (e) => e.id === sessionExerciseId
    );
    const nextExercises = session.exercises.filter(
      (e) => e.id !== sessionExerciseId
    );

    setSession({ ...session, exercises: nextExercises });

    if (removedIndex >= 0) {
      if (nextExercises.length === 0) {
        setExerciseIndex(0);
      } else if (removedIndex < exerciseIndex) {
        setExerciseIndex((i) => Math.max(0, i - 1));
      } else if (removedIndex === exerciseIndex) {
        setExerciseIndex((i) => Math.min(i, nextExercises.length - 1));
      }
    }

    setRestByExerciseId((prev) => {
      const next = { ...prev };
      delete next[sessionExerciseId];
      return next;
    });

    if (scope === "plan") {
      toast.success(
        `Removed from ${planName ?? session.planName ?? "this plan"} permanently`
      );
    } else {
      toast.success("Removed from this session");
    }
  };

  const startRemoveExercise = (ex: ExerciseBlock) => {
    setRemoveTarget({
      sessionExerciseId: ex.id,
      exerciseName: ex.exercise.name,
      loggedSetCount: loggedSetCount(ex),
    });
  };

  const finishSession = async () => {
    await fetch(`/api/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionNotes: notes, overallFeel: feel }),
    });
    router.push("/today");
  };

  const workingSets = useMemo(
    () => current?.sets.filter((s) => !s.isWarmup) ?? [],
    [current]
  );
  const warmupSets = useMemo(
    () => current?.sets.filter((s) => s.isWarmup) ?? [],
    [current]
  );

  if (!session) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-zinc-500">
        <span className="animate-pulse text-4xl">🏋️</span>
        <p className="font-medium">Loading workout…</p>
      </div>
    );
  }

  if (session.exercises.length === 0) {
    return (
      <motion.div
        layout
        className="flex min-h-screen flex-col bg-mesh px-4 pb-8 pt-4"
      >
        <Button variant="ghost" size="sm" onClick={() => router.push("/today")}>
          <ChevronLeft className="h-4 w-4" /> Exit
        </Button>
        <p className="mt-12 text-center text-zinc-400">
          No exercises in this session.
        </p>
        <Button
          variant="outline"
          className="mx-auto mt-6 h-12 w-full max-w-sm border-dashed border-emerald-600/50 bg-emerald-950/20 text-base font-bold text-emerald-300"
          onClick={() => setAddExerciseOpen(true)}
        >
          <Plus className="h-5 w-5" /> Add Exercise
        </Button>
        <AddExerciseSheet
          open={addExerciseOpen}
          onClose={() => setAddExerciseOpen(false)}
          sessionId={sessionId}
          planId={session.planId}
          planName={session.planName}
          sessionExerciseIds={new Set()}
          onAdded={async (exerciseId, defaultRestSeconds) => {
            const res = await fetch(`/api/sessions/${sessionId}`);
            if (!res.ok) return;
            const data: SessionData = await res.json();
            setSession(data);
            const idx = data.exercises.findIndex(
              (e) => e.exerciseId === exerciseId
            );
            const block = idx >= 0 ? data.exercises[idx] : null;
            if (block) {
              setRestByExerciseId((prev) => ({
                ...prev,
                [block.id]: defaultRestSeconds,
              }));
              setExerciseIndex(idx);
            }
          }}
        />
      </motion.div>
    );
  }

  if (!current) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-zinc-500">
        <span className="animate-pulse text-4xl">🏋️</span>
        <p className="font-medium">Loading workout…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-mesh px-4 pb-8 pt-4">
      <PrBanner
        show={!!prDetail}
        detail={prDetail}
        onDismiss={() => setPrDetail(null)}
      />

      {session.isDeload && (
        <div className="mb-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-center text-sm font-bold text-amber-100">
          😴 Deload Week — Recovery is progress
        </div>
      )}

      <div className="mb-2">
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/today")}>
            <ChevronLeft className="h-4 w-4" /> Exit
          </Button>
          <SectionLabel>
            Exercise {exerciseIndex + 1} of {session.exercises.length}
          </SectionLabel>
          <Button variant="ghost" size="icon" onClick={() => setCoachOpen(true)}>
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Session exercises
        </p>
        <motion.div layout className="flex gap-2 overflow-x-auto pb-1">
          <AnimatePresence mode="popLayout">
            {session.exercises.map((ex, i) => {
              const status = getExerciseProgress(ex.sets);
              const inSuperset = ex.supersetGroupId != null;
              return (
              <motion.div
                key={ex.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                className="flex shrink-0 items-stretch gap-0.5"
              >
                <button
                  type="button"
                  onClick={() => {
                    setPrDetail(null);
                    setExerciseIndex(i);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                    i === exerciseIndex
                      ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-200"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600",
                    status === "done" && i !== exerciseIndex && "border-emerald-800/40",
                    status === "partial" && i !== exerciseIndex && "border-amber-700/40"
                  )}
                >
                  <span className="flex max-w-[120px] items-center gap-1 truncate">
                    {progressLabel(status) && (
                      <span
                        className={cn(
                          "text-[10px]",
                          status === "done" ? "text-emerald-400" : "text-amber-400"
                        )}
                      >
                        {progressLabel(status)}
                      </span>
                    )}
                    <span className="truncate">{ex.exercise.name}</span>
                  </span>
                  {inSuperset && (
                    <span className="mt-0.5 block text-[9px] font-bold uppercase text-violet-400">
                      SS
                    </span>
                  )}
                  {ex.isUserAdded && (
                    <span className="mt-0.5 block text-[9px] font-medium text-zinc-500">
                      + you
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => startRemoveExercise(ex)}
                  className="flex w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-red-900/50 hover:bg-red-950/30 hover:text-red-400"
                  aria-label={`Remove ${ex.exercise.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
            })}
          </AnimatePresence>
        </motion.div>
        <Button
          variant="outline"
          className="h-12 w-full border-dashed border-emerald-600/50 bg-emerald-950/20 text-base font-bold text-emerald-300 hover:bg-emerald-950/40"
          onClick={() => setAddExerciseOpen(true)}
        >
          <Plus className="h-5 w-5" /> Add Exercise
        </Button>
      </div>

      <p className="mt-4 text-center text-xs font-medium text-emerald-400/90">
        Let&apos;s get to work 🔥
      </p>
      <div className="mt-1 flex items-center justify-center gap-2">
        <h1 className="text-center text-3xl font-extrabold leading-tight tracking-tight text-zinc-50">
          {current.exercise.name}
        </h1>
        {current.supersetGroupId != null && (
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-300">
            Superset
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-zinc-700 text-xs"
          onClick={() => setShowExerciseInfo((o) => !o)}
        >
          <Info className="h-3.5 w-3.5" />
          {showExerciseInfo ? "Hide info" : "Exercise info"}
        </Button>
        {session.exercises.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-violet-700/50 text-xs text-violet-300"
            onClick={openSupersetSheet}
          >
            <Link2 className="h-3.5 w-3.5" />
            {current.supersetGroupId != null ? "Manage superset" : "Superset"}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-zinc-700 text-xs"
          disabled={exerciseIndex === 0}
          onClick={() => void moveExercise(exerciseIndex, -1)}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-zinc-700 text-xs"
          disabled={exerciseIndex >= session.exercises.length - 1}
          onClick={() => void moveExercise(exerciseIndex, 1)}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      <AnimatePresence>
        {showExerciseInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="mt-3 space-y-2 border-zinc-700/80 p-4 text-sm text-zinc-300">
              {current.muscleGroup && (
                <p>
                  <span className="font-semibold text-zinc-400">Muscle: </span>
                  {current.muscleGroup.name}
                </p>
              )}
              {current.exercise.equipment && (
                <p>
                  <span className="font-semibold text-zinc-400">Equipment: </span>
                  {current.exercise.equipment}
                </p>
              )}
              {current.exercise.instructions ? (
                <p className="leading-relaxed">{current.exercise.instructions}</p>
              ) : (
                <p className="text-zinc-500">No written cues for this movement yet.</p>
              )}
              <a
                href={youtubeSearchUrl(current.exercise.youtubeQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-red-400 hover:text-red-300"
              >
                Form video <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {current.isUserAdded && (
        <p className="mt-1 text-center">
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Added by you
          </span>
        </p>
      )}

      {current.suggestion && (
        <p className="mt-2 text-center text-xs font-semibold text-emerald-400">
          ⬆️ Suggested:{" "}
          {formatWeightShort(current.suggestion.suggestedWeightKg, preferredUnit)}{" "}
          <span className="text-zinc-500">
            (was {formatWeightShort(current.suggestion.lastWeightKg, preferredUnit)})
          </span>
        </p>
      )}

      {prDetail && (
        <p className="animate-pr-pulse mt-2 text-center text-sm font-bold text-amber-400">
          🏆 PR — {prDetail}
        </p>
      )}

      {current.lastPerformance && (
        <p className="mt-2 text-center text-xs text-zinc-500">
          Last:{" "}
          {current.lastPerformance.sets
            .map(
              (s) =>
                `${s.reps ?? "?"}×${displayWeightValue(s.weightKg, preferredUnit) ?? "BW"}`
            )
            .join(", ")}
        </p>
      )}

      {current.lastPerformance?.typical &&
        (current.lastPerformance.typical.reps != null ||
          current.lastPerformance.typical.weightKg != null) && (
          <p className="mt-1 text-center text-xs text-emerald-500/90">
            Usual: {current.lastPerformance.typical.reps ?? "?"} reps
            {current.lastPerformance.typical.weightKg != null &&
              !current.exercise.isBodyweight &&
              ` @ ${formatWeightShort(current.lastPerformance.typical.weightKg, preferredUnit)}`}
          </p>
        )}

      <motion.div layout className="mx-auto mt-4 flex w-full max-w-sm gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-emerald-600/50 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40"
          onClick={addWorkingSet}
        >
          <Plus className="h-4 w-4" /> Add Set
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-zinc-700"
          onClick={addWarmup}
        >
          <Plus className="h-4 w-4" /> Warm-up
        </Button>
      </motion.div>

      <div className="mt-4 flex-1 space-y-2">
        {[...warmupSets, ...workingSets].map((set) => (
          <SetCard
            key={set.id}
            set={set}
            isActive={set.id === firstIncompleteId}
            isBodyweight={current.exercise.isBodyweight}
            preferredUnit={preferredUnit}
            typical={current.lastPerformance?.typical ?? null}
            onUpdate={updateSet}
            onDelete={() => void deleteSet(set.id)}
            onPlate={() => setPlateOpen(true)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setCardioOpen((o) => !o)}
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left text-sm font-semibold text-zinc-300"
      >
        <span>🏃 Add Cardio</span>
        {cardioOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      <AnimatePresence>
        {cardioOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="mt-2 border-dashed text-center text-sm text-zinc-500">
              Log duration, distance &amp; intensity after your lifts.
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
            onClick={() => {
              setPrDetail(null);
              setExerciseIndex((i) => i + 1);
            }}
          >
            Next <ChevronRight />
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => setShowComplete(true)}>
            Finish 💪
          </Button>
        )}
      </div>

      <AnimatePresence>
        {restSeconds != null && !restMinimized && (
          <RestTimerOverlay
            seconds={restSeconds}
            total={restTotal}
            onSkip={() => setRestSeconds(null)}
            onHide={() => setRestMinimized(true)}
          />
        )}
        {restSeconds != null && restMinimized && (
          <RestTimerMinimized
            seconds={restSeconds}
            total={restTotal}
            onExpand={() => setRestMinimized(false)}
            onSkip={() => setRestSeconds(null)}
          />
        )}
      </AnimatePresence>

      {showWearableNotice && (
        <WearableNotice onDismiss={() => setShowWearableNotice(false)} />
      )}

      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm">
          <Card className="w-full rounded-b-none rounded-t-3xl border-zinc-700 p-6">
            <h2 className="text-xl font-extrabold">How did it feel?</h2>
            <p className="mt-1 text-xs text-zinc-500">Tap your honest vibe</p>
            <div className="my-5 flex justify-between gap-2">
              {FEEL_EMOJIS.map((emoji, i) => {
                const n = i + 1;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFeel(n)}
                    className={cn(
                      "flex h-14 flex-1 flex-col items-center justify-center rounded-2xl transition-all",
                      feel === n
                        ? "scale-105 bg-emerald-600 ring-2 ring-emerald-400"
                        : "bg-zinc-800 hover:bg-zinc-700"
                    )}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="mt-0.5 text-[9px] font-bold uppercase text-zinc-400">
                      {feelLabel(n)}
                    </span>
                  </button>
                );
              })}
            </div>
            <Input
              placeholder="Session notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mb-4"
            />
            <Button className="h-14 w-full text-lg font-bold" onClick={finishSession}>
              Complete Workout 🔥
            </Button>
          </Card>
        </div>
      )}

      <PlateCalculator open={plateOpen} onClose={() => setPlateOpen(false)} />
      <AddExerciseSheet
        open={addExerciseOpen}
        onClose={() => setAddExerciseOpen(false)}
        sessionId={sessionId}
        planId={session.planId}
        planName={session.planName}
        sessionExerciseIds={
          new Set(session.exercises.map((e) => e.exerciseId))
        }
        onAdded={async (exerciseId, defaultRestSeconds) => {
          const res = await fetch(`/api/sessions/${sessionId}`);
          if (!res.ok) return;
          const data: SessionData = await res.json();
          setSession(data);
          const idx = data.exercises.findIndex(
            (e) => e.exerciseId === exerciseId
          );
          const block = idx >= 0 ? data.exercises[idx] : null;
          if (block) {
            setRestByExerciseId((prev) => ({
              ...prev,
              [block.id]: defaultRestSeconds,
            }));
            setExerciseIndex(idx);
          }
        }}
      />
      <RemoveExerciseSheet
        open={removeTarget != null}
        onClose={() => setRemoveTarget(null)}
        sessionId={sessionId}
        planId={session.planId}
        planName={session.planName}
        target={removeTarget}
        onRemoved={(scope, planName) => {
          if (!removeTarget) return;
          handleExerciseRemoved(
            removeTarget.sessionExerciseId,
            scope,
            planName
          );
        }}
      />
      <SupersetSheet
        open={supersetTarget != null}
        onClose={() => setSupersetTarget(null)}
        sessionId={sessionId}
        target={supersetTarget}
        partners={session.exercises.map((ex) => ({
          sessionExerciseId: ex.id,
          exerciseName: ex.exercise.name,
          supersetGroupId: ex.supersetGroupId,
        }))}
        onChanged={async () => {
          const anchorId = supersetTarget?.sessionExerciseId;
          const res = await fetch(`/api/sessions/${sessionId}`);
          if (res.ok) {
            const data: SessionData = await res.json();
            setSession(data);
            if (anchorId != null) {
              const idx = data.exercises.findIndex((e) => e.id === anchorId);
              if (idx >= 0) setExerciseIndex(idx);
            }
          }
          toast.success("Superset updated");
        }}
      />
      {coachOpen && (
        <WorkoutCoach
          session={session}
          exercise={current}
          onClose={() => setCoachOpen(false)}
        />
      )}

      <button
        type="button"
        onClick={() => setCoachOpen(true)}
        className="fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl shadow-lg shadow-emerald-600/40 ring-2 ring-emerald-400/50"
        aria-label="Ask your coach"
      >
        🤖
      </button>
    </div>
  );
}

function SetCard({
  set,
  isActive,
  isBodyweight,
  preferredUnit,
  typical,
  onUpdate,
  onDelete,
  onPlate,
}: {
  set: SetRow;
  isActive: boolean;
  isBodyweight: boolean;
  preferredUnit: "lbs" | "kg";
  typical: { reps: number | null; weightKg: number | null } | null;
  onUpdate: (id: number, patch: Record<string, unknown>) => void;
  onDelete: () => void;
  onPlate: () => void;
}) {
  const [justCompleted, setJustCompleted] = useState(false);
  const display =
    set.weightKg != null ? displayWeightValue(set.weightKg, preferredUnit) : "";

  const toggleComplete = () => {
    const next = !set.isCompleted;
    if (next) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onUpdate(set.id, { isCompleted: next });
  };

  const applyTypical = () => {
    if (!typical) return;
    const patch: Record<string, unknown> = {};
    if (typical.reps != null) patch.reps = typical.reps;
    if (typical.weightKg != null && (!isBodyweight || set.weightKg)) {
      patch.weightDisplay = displayWeightValue(typical.weightKg, preferredUnit);
    }
    if (Object.keys(patch).length > 0) onUpdate(set.id, patch);
  };

  const canApplyTypical =
    typical &&
    !set.isCompleted &&
    (typical.reps != null || (typical.weightKg != null && !isBodyweight));

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl border-2 p-3 transition-colors",
        set.isCompleted
          ? "border-emerald-600/60 bg-emerald-950/40"
          : "border-zinc-700/80 bg-zinc-900/50",
        set.isWarmup && "opacity-75",
        isActive && !set.isCompleted && "animate-glow-pulse border-emerald-500/50"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black",
              set.isWarmup ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-zinc-200"
            )}
          >
            {set.isWarmup ? "W" : set.setNumber}
          </span>
          <button
            type="button"
            onClick={onDelete}
            className="text-zinc-600 hover:text-red-400"
            aria-label="Delete set"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Reps"
          className="h-11 w-16 border-zinc-700 bg-zinc-950"
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
              className="h-11 w-20 border-zinc-700 bg-zinc-950 font-bold"
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
              className="text-lg hover:scale-110"
              aria-label="Plate calculator"
            >
              🧮
            </button>
          </div>
        )}
        <Input
          type="number"
          inputMode="numeric"
          placeholder="RPE"
          className="h-11 w-14 border-zinc-700 bg-zinc-950"
          min={1}
          max={10}
          defaultValue={set.rpe ?? ""}
          onBlur={(e) =>
            onUpdate(set.id, {
              rpe: parseInt(e.target.value, 10) || null,
            })
          }
        />
        <div className="ml-auto flex flex-col items-end gap-1">
          {canApplyTypical && (
            <button
              type="button"
              onClick={applyTypical}
              className="rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-zinc-700"
            >
              Use last
            </button>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={toggleComplete}
            className={cn(
              "flex min-h-11 min-w-[72px] items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors",
              set.isCompleted
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 text-zinc-200 ring-1 ring-zinc-600"
            )}
          >
            {justCompleted || set.isCompleted ? (
              <span className={cn(justCompleted && "animate-set-pop")}>✅</span>
            ) : (
              "Log"
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
