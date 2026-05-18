"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { DifficultyPill } from "@/components/ui/difficulty-pill";
import { MuscleGroupAccordion } from "@/components/exercises/muscle-group-accordion";
import { cn } from "@/lib/utils";
import { youtubeSearchUrl } from "@/lib/utils";

export type LibraryExercise = {
  id: number;
  name: string;
  muscleGroupName: string | null;
  equipment: string | null;
  difficulty: string | null;
  youtubeQuery: string | null;
};

function ExercisePickerCard({
  ex,
  added,
  adding,
  onAdd,
}: {
  ex: LibraryExercise;
  added: boolean;
  adding: boolean;
  onAdd: () => void;
}) {
  const youtubeUrl = youtubeSearchUrl(ex.youtubeQuery);

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-3">
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25"
        aria-label={`${ex.name} form video on YouTube`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-black leading-none">▶</span>
      </a>

      <motion.div layout className="min-w-0 flex-1">
        <p className="truncate font-bold text-zinc-100">{ex.name}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {[ex.muscleGroupName, ex.equipment].filter(Boolean).join(" · ") ||
            "—"}
        </p>
      </motion.div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <DifficultyPill difficulty={ex.difficulty} />
      </div>

      <button
        type="button"
        disabled={added || adding}
        onClick={onAdd}
        className={cn(
          "shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-colors",
          added
            ? "bg-zinc-800 text-zinc-500"
            : "bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
        )}
      >
        {added ? "✓ Added" : adding ? "…" : "+ Add"}
      </button>
    </div>
  );
}

export function AddExerciseSheet({
  open,
  onClose,
  sessionId,
  planId,
  sessionExerciseIds,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  planId: number | null;
  sessionExerciseIds: Set<number>;
  onAdded: (exerciseId: number, defaultRestSeconds: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [suggestions, setSuggestions] = useState<LibraryExercise[]>([]);
  const [library, setLibrary] = useState<LibraryExercise[]>([]);
  const [query, setQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<number>>(() => new Set(sessionExerciseIds));
  const [addingId, setAddingId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAddedIds(new Set(sessionExerciseIds));
  }, [sessionExerciseIds]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const loadData = useCallback(async () => {
    const libRes = await fetch("/api/exercises");
    if (libRes.ok) {
      const data = await libRes.json();
      setLibrary(data.exercises ?? []);
    }

    if (planId == null) {
      setSuggestions([]);
      return;
    }

    const sugRes = await fetch(
      `/api/session/suggest-exercises?planId=${planId}&sessionId=${sessionId}`
    );
    if (sugRes.ok) {
      const data = await sugRes.json();
      setSuggestions(data.suggestions ?? []);
    }
  }, [planId, sessionId]);

  useEffect(() => {
    if (open) {
      loadData();
      setQuery("");
      const t = setTimeout(() => searchRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [open, loadData]);

  const filteredLibrary = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library;
    return library.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        (ex.muscleGroupName?.toLowerCase().includes(q) ?? false) ||
        (ex.equipment?.toLowerCase().includes(q) ?? false)
    );
  }, [library, query]);

  const isSearching = query.trim().length > 0;

  const addExercise = async (exerciseId: number) => {
    if (addedIds.has(exerciseId) || addingId != null) return;
    setAddingId(exerciseId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAddedIds((prev) => new Set(prev).add(exerciseId));
        onAdded(exerciseId, data.defaultRestSeconds ?? 90);
      }
    } finally {
      setAddingId(null);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Add exercise"
          className="fixed inset-0 z-[100] flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            aria-label="Close"
            onClick={onClose}
          />

          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 400) onClose();
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 flex max-h-[88vh] w-full flex-col rounded-t-3xl border-t border-zinc-700 bg-zinc-950 shadow-2xl"
          >
            <motion.div
              className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-zinc-600"
              aria-hidden
            />

            <motion.div layout className="flex items-center justify-between px-4 pt-3 pb-2">
              <h2 className="text-lg font-extrabold text-zinc-50">Add Exercise</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>

            <div className="flex-1 overflow-y-auto px-4 pb-8">
              {planId == null && (
                <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  Suggestions need a plan on this session. You can still search the
                  full library below.
                </p>
              )}

              <SectionLabel className="mb-2">Suggestions for you 💡</SectionLabel>
              <div className="space-y-2">
                {suggestions.length === 0 ? (
                  <p className="py-4 text-center text-sm text-zinc-500">
                    {planId == null
                      ? "No plan linked to this session"
                      : "No suggestions right now"}
                  </p>
                ) : (
                  suggestions.map((ex) => (
                    <ExercisePickerCard
                      key={ex.id}
                      ex={ex}
                      added={addedIds.has(ex.id)}
                      adding={addingId === ex.id}
                      onAdd={() => addExercise(ex.id)}
                    />
                  ))
                )}
              </div>

              <SectionLabel className="mb-2 mt-6">Full Library 📚</SectionLabel>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  ref={searchRef}
                  placeholder="Search name or muscle group"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-zinc-700 bg-zinc-900 pl-9"
                />
              </div>

              <MuscleGroupAccordion
                items={filteredLibrary}
                isSearching={isSearching}
                emptyMessage="No matches"
                renderItem={(ex) => (
                  <ExercisePickerCard
                    ex={ex}
                    added={addedIds.has(ex.id)}
                    adding={addingId === ex.id}
                    onAdd={() => addExercise(ex.id)}
                  />
                )}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
