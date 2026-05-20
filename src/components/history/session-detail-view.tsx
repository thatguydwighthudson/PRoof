"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { useUser } from "@/components/providers/user-provider";
import { displayWeight, formatWeightShort } from "@/lib/units";
import { feelEmoji, feelLabel } from "@/lib/ui/feel";
import { getPlanTheme } from "@/lib/ui/plan-theme";
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
  notes: string | null;
  exercise: {
    id: number;
    name: string;
    isBodyweight: boolean;
  };
  sets: SetRow[];
};

type SessionDetail = {
  id: number;
  sessionDate: string;
  planName: string | null;
  durationMins: number | null;
  sessionNotes: string | null;
  overallFeel: number | null;
  isDeload: boolean;
  endedAt: string | null;
  exercises: ExerciseBlock[];
};

function formatSessionDate(raw: string): string {
  const iso = raw.includes("T") ? raw : `${raw}T12:00:00`;
  return format(parseISO(iso), "EEEE, MMM d, yyyy");
}

function formatSetLine(
  set: SetRow,
  isBodyweight: boolean,
  unit: "lbs" | "kg"
): string | null {
  if (!set.isCompleted && set.reps == null && set.weightKg == null) {
    return null;
  }

  const parts: string[] = [];
  if (set.reps != null) parts.push(`${set.reps} reps`);
  if (set.weightKg != null) {
    parts.push(displayWeight(set.weightKg, unit));
  } else if (isBodyweight && set.reps != null) {
    parts.push("bodyweight");
  }
  if (parts.length === 0) return set.isCompleted ? "Logged" : null;

  let line = parts.join(" × ");
  if (set.rpe != null) line += ` @ RPE ${set.rpe}`;
  return line;
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-lg bg-zinc-800 px-2 py-1">
      <span className="font-bold text-zinc-200">{value}</span>{" "}
      <span className="text-zinc-500">{label}</span>
    </span>
  );
}

function SetGroup({
  label,
  sets,
  isBodyweight,
  unit,
}: {
  label: string;
  sets: SetRow[];
  isBodyweight: boolean;
  unit: "lbs" | "kg";
}) {
  const rows = sets
    .map((set) => ({ set, line: formatSetLine(set, isBodyweight, unit) }))
    .filter((row): row is { set: SetRow; line: string } => row.line != null);

  if (rows.length === 0) return null;

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <ul className="space-y-1.5">
        {rows.map(({ set, line }) => (
          <li
            key={set.id}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
              set.isCompleted
                ? "bg-emerald-950/40 text-zinc-200"
                : "bg-zinc-800/50 text-zinc-400"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black",
                set.isWarmup ? "bg-zinc-700 text-zinc-300" : "bg-zinc-700 text-zinc-200"
              )}
            >
              {set.isWarmup ? "W" : set.setNumber}
            </span>
            <span className="font-medium">{line}</span>
            {set.isCompleted && <span className="ml-auto text-xs">✅</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SessionDetailView({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const { preferredUnit } = useUser();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (res.status === 404) {
      setNotFound(true);
      setSession(null);
    } else if (res.ok) {
      setSession(await res.json());
      setNotFound(false);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const repeat = async () => {
    const res = await fetch("/api/sessions/clone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceSessionId: sessionId }),
    });
    const data = await res.json();
    router.push(`/workout/${data.id}`);
  };

  if (loading) {
    return (
      <div className="bg-mesh min-h-screen px-4 pb-8 pt-6">
        <p className="text-sm text-zinc-500">Loading session…</p>
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="bg-mesh min-h-screen px-4 pb-8 pt-6">
        <Link
          href="/history"
          className="mb-4 inline-flex items-center text-sm font-medium text-zinc-500 hover:text-emerald-400"
        >
          <ChevronLeft className="h-4 w-4" /> History
        </Link>
        <Card className="py-12 text-center">
          <p className="text-zinc-500">Session not found.</p>
        </Card>
      </div>
    );
  }

  const theme = getPlanTheme(session.planName ?? "Workout");
  const planLabel = session.planName ?? "Workout";
  const completedSets = session.exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.isCompleted).length,
    0
  );

  return (
    <div className="bg-mesh min-h-screen px-4 pb-8 pt-6">
      <Link
        href="/history"
        className="mb-4 inline-flex items-center text-sm font-medium text-zinc-500 hover:text-emerald-400"
      >
        <ChevronLeft className="h-4 w-4" /> History
      </Link>

      <Card className={cn("border-l-4 pl-4", theme.border)}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-2xl font-extrabold text-zinc-50">
              {theme.emoji} {planLabel}
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-400">
              {formatSessionDate(session.endedAt ?? session.sessionDate)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {session.isDeload && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                😴 DELOAD
              </span>
            )}
            {!session.endedAt && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                In progress
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <StatPill label="exercises" value={session.exercises.length} />
          <StatPill label="sets logged" value={completedSets} />
          {session.durationMins != null && (
            <StatPill label="min" value={session.durationMins} />
          )}
          {session.overallFeel != null && (
            <span className="rounded-lg bg-zinc-800 px-2 py-1">
              <span className="font-bold text-zinc-200">
                {feelEmoji(session.overallFeel)}
              </span>{" "}
              <span className="text-zinc-500">
                {feelLabel(session.overallFeel)}
              </span>
            </span>
          )}
        </div>
        {session.sessionNotes && (
          <p className="mt-3 rounded-lg bg-zinc-800/60 px-3 py-2 text-sm text-zinc-300">
            {session.sessionNotes}
          </p>
        )}
      </Card>

      <div className="mt-8 space-y-4">
        <SectionLabel>Exercises</SectionLabel>
        {session.exercises.length === 0 ? (
          <Card className="py-8 text-center text-sm text-zinc-500">
            No exercises recorded.
          </Card>
        ) : (
          session.exercises.map((ex) => {
            const warmups = ex.sets.filter((s) => s.isWarmup);
            const working = ex.sets.filter((s) => !s.isWarmup);
            const topWeight = working
              .map((s) => s.weightKg)
              .filter((w): w is number => w != null)
              .sort((a, b) => b - a)[0];

            return (
              <Card key={ex.id}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="font-extrabold text-zinc-50">{ex.exercise.name}</p>
                  {topWeight != null && !ex.exercise.isBodyweight && (
                    <span className="shrink-0 text-xs font-bold text-emerald-400">
                      Top {formatWeightShort(topWeight, preferredUnit)}
                    </span>
                  )}
                </div>
                {ex.notes && (
                  <p className="mb-3 text-xs text-zinc-500">{ex.notes}</p>
                )}
                <div className="space-y-3">
                  <SetGroup
                    label="Warm-up"
                    sets={warmups}
                    isBodyweight={ex.exercise.isBodyweight}
                    unit={preferredUnit}
                  />
                  <SetGroup
                    label="Working"
                    sets={working}
                    isBodyweight={ex.exercise.isBodyweight}
                    unit={preferredUnit}
                  />
                </div>
              </Card>
            );
          })
        )}
      </div>

      <div className="mt-8 space-y-3">
        {!session.endedAt && (
          <Button
            className="w-full"
            variant="default"
            onClick={() => router.push(`/workout/${sessionId}`)}
          >
            Continue Workout
          </Button>
        )}
        <Button
          className="w-full"
          variant={session.endedAt ? "default" : "outline"}
          onClick={repeat}
        >
          🔁 Repeat This Workout
        </Button>
      </div>
    </div>
  );
}
