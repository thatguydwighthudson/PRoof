export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, or, isNull } from "drizzle-orm";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { exercises, muscleGroups, num } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPersonalRecord } from "@/lib/services/pr";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { DifficultyPill } from "@/components/ui/difficulty-pill";
import { displayWeight } from "@/lib/units";
import { youtubeSearchUrl } from "@/lib/utils";
import type { PreferredUnit } from "@/lib/units";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exerciseId = parseInt(id, 10);
  if (Number.isNaN(exerciseId)) notFound();

  const user = await getAuthenticatedUser();
  const userId = user.id;
  const [row] = await db
    .select({
      exercise: exercises,
      muscleGroup: muscleGroups,
    })
    .from(exercises)
    .leftJoin(muscleGroups, eq(exercises.muscleGroupId, muscleGroups.id))
    .where(
      and(
        eq(exercises.id, exerciseId),
        or(isNull(exercises.userId), eq(exercises.userId, userId))
      )
    )
    .limit(1);

  if (!row) notFound();

  const { exercise, muscleGroup } = row;
  const unit = (user.preferredUnit as PreferredUnit) ?? "lbs";
  const pr = await getPersonalRecord(exerciseId);

  const youtubeUrl = youtubeSearchUrl(exercise.youtubeQuery);

  return (
    <div className="bg-mesh min-h-screen px-4 pb-8 pt-6">
      <Link
        href="/exercises"
        className="mb-4 inline-flex items-center text-sm font-medium text-charcoal-500 hover:text-proof-400"
      >
        <ChevronLeft className="h-4 w-4" /> Exercises
      </Link>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <DifficultyPill difficulty={exercise.difficulty} />
        {exercise.isBodyweight && (
          <span className="rounded-full bg-charcoal-800 px-2 py-0.5 text-[10px] font-bold uppercase text-charcoal-400">
            Bodyweight
          </span>
        )}
        {muscleGroup && (
          <span className="rounded-full bg-proof-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-proof-300">
            {muscleGroup.name}
          </span>
        )}
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-charcoal-50">
        {exercise.name}
      </h1>
      {exercise.equipment && (
        <p className="mt-1 text-sm text-charcoal-500">{exercise.equipment}</p>
      )}

      {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
        <p className="mt-2 text-xs text-charcoal-500">
          Also hits: {exercise.secondaryMuscles.join(", ")}
        </p>
      )}

      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600/20 px-4 py-2.5 text-sm font-semibold text-red-300 ring-1 ring-red-500/30"
      >
        Watch form on YouTube <ExternalLink className="h-4 w-4" />
      </a>

      {exercise.instructions && (
        <Card className="mt-6">
          <SectionLabel>Instructions</SectionLabel>
          <p className="mt-3 text-sm leading-relaxed text-charcoal-300">
            {exercise.instructions}
          </p>
        </Card>
      )}

      <Card className="mt-4 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-charcoal-900">
        <SectionLabel>Personal records 🏆</SectionLabel>
        {!pr ? (
          <p className="mt-3 text-sm text-charcoal-500">
            No PR logged yet. Complete a workout with this exercise to set your
            first record.
          </p>
        ) : (
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PrStat
              label="Best weight"
              value={
                pr.bestWeightKg
                  ? `${displayWeight(num(pr.bestWeightKg), unit)}${pr.bestWeightReps ? ` × ${pr.bestWeightReps}` : ""}`
                  : "—"
              }
            />
            <PrStat
              label="Best reps"
              value={pr.bestReps != null ? String(pr.bestReps) : "—"}
            />
            <PrStat
              label="Best volume"
              value={
                pr.bestVolumeKg
                  ? displayWeight(num(pr.bestVolumeKg), unit)
                  : "—"
              }
            />
          </dl>
        )}
      </Card>
    </div>
  );
}

function PrStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-extrabold tabular-nums text-charcoal-50">
        {value}
      </dd>
    </div>
  );
}
