"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DifficultyPill } from "@/components/ui/difficulty-pill";
import { MuscleGroupAccordion } from "@/components/exercises/muscle-group-accordion";
import { MUSCLE_DOT } from "@/lib/exercise-muscle-groups";
import { cn } from "@/lib/utils";

export type ExerciseListItem = {
  id: number;
  name: string;
  difficulty: string | null;
  isBodyweight: boolean;
  muscleGroupName: string | null;
  equipment: string | null;
};

function ExerciseRow({ ex }: { ex: ExerciseListItem }) {
  const dot =
    (ex.muscleGroupName && MUSCLE_DOT[ex.muscleGroupName]) ?? "bg-charcoal-500";

  return (
    <Link href={`/exercises/${ex.id}`}>
      <div className="rounded-xl border border-charcoal-800/80 bg-charcoal-900/50 p-3 transition hover:border-charcoal-600 hover:bg-charcoal-900 active:scale-[0.99]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 gap-3">
            <span
              className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", dot)}
            />
            <div className="min-w-0">
              <p className="break-words font-bold leading-snug text-charcoal-100">
                {ex.name}
              </p>
              <p className="mt-0.5 text-xs text-charcoal-500">
                {ex.equipment ?? "—"}
                {ex.isBodyweight ? " · Bodyweight" : ""}
              </p>
            </div>
          </div>
          <div className="shrink-0 self-start">
            <DifficultyPill difficulty={ex.difficulty} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ExerciseBrowser({ items }: { items: ExerciseListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        (ex.muscleGroupName?.toLowerCase().includes(q) ?? false) ||
        (ex.equipment?.toLowerCase().includes(q) ?? false)
    );
  }, [items, query]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-500" />
        <Input
          type="search"
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 border-charcoal-700 bg-charcoal-900/80 pl-10 text-base"
          aria-label="Search exercises"
        />
      </div>

      <p className="text-xs text-charcoal-500">
        {filtered.length} of {items.length} exercises
      </p>

      <MuscleGroupAccordion
        items={filtered}
        isSearching={isSearching}
        renderItem={(ex) => <ExerciseRow ex={ex} />}
      />
    </div>
  );
}
