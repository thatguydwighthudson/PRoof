"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookmarkPlus, Calendar, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { DifficultyPill } from "@/components/ui/difficulty-pill";
import { MuscleGroupAccordion } from "@/components/exercises/muscle-group-accordion";
import { Button } from "@/components/ui/button";
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

type PendingAdd = {
  exerciseId: number;
  exerciseName: string;
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
    <motion.div layout className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-3">
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
    </motion.div>
  );
}

export function AddExerciseSheet({
  open,
  onClose,
  sessionId,
  planId,
  planName,
  sessionExerciseIds,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  planId: number | null;
  planName?: string | null;
  sessionExerciseIds: Set<number>;
  onAdded: (exerciseId: number, defaultRestSeconds: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [suggestions, setSuggestions] = useState<LibraryExercise[]>([]);
  const [library, setLibrary] = useState<LibraryExercise[]>([]);
  const [query, setQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<number>>(() => new Set(sessionExerciseIds));
  const [addingId, setAddingId] = useState<number | null>(null);
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);
  const [pendingScope, setPendingScope] = useState<"session" | "plan" | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAddedIds(new Set(sessionExerciseIds));
  }, [sessionExerciseIds]);

  useEffect(() => {
    if (!open) {
      setPendingAdd(null);
      setPendingScope(null);
    }
  }, [open]);

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

  const executeAdd = async (exerciseId: number, scope: "session" | "plan") => {
    setAddingId(exerciseId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          scope: scope === "plan" && planId != null ? "plan" : "session",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAddedIds((prev) => new Set(prev).add(exerciseId));
        if (data.scope === "plan") {
          toast.success(
            `Added to ${data.planName ?? planName ?? "your plan"} permanently`
          );
        }
        onAdded(exerciseId, data.defaultRestSeconds ?? 90);
        setPendingAdd(null);
        setPendingScope(null);
      }
    } finally {
      setAddingId(null);
    }
  };

  const startAdd = (ex: LibraryExercise) => {
    if (addedIds.has(ex.id) || addingId != null) return;
    if (planId == null) {
      void executeAdd(ex.id, "session");
      return;
    }
    setPendingAdd({ exerciseId: ex.id, exerciseName: ex.name });
  };

  const chooseSession = () => {
    if (!pendingAdd) return;
    void executeAdd(pendingAdd.exerciseId, "session");
  };

  const choosePlan = () => {
    if (!pendingAdd || planId == null) return;
    setPendingScope("plan");
  };

  const confirmPlan = () => {
    if (!pendingAdd) return;
    void executeAdd(pendingAdd.exerciseId, "plan");
  };

  if (!mounted) return null;

  const showScopePicker = pendingAdd != null && pendingScope == null;
  const showPlanConfirm = pendingAdd != null && pendingScope === "plan";

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

            <motion.div layout className="flex-1 overflow-y-auto px-4 pb-8">
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
                      onAdd={() => startAdd(ex)}
                    />
                  ))
                )}
              </div>

              <SectionLabel className="mb-2 mt-6">Full Library 📚</SectionLabel>
              <motion.div layout className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  ref={searchRef}
                  placeholder="Search name or muscle group"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-zinc-700 bg-zinc-900 pl-9"
                />
              </motion.div>

              <MuscleGroupAccordion
                items={filteredLibrary}
                isSearching={isSearching}
                emptyMessage="No matches"
                renderItem={(ex) => (
                  <ExercisePickerCard
                    ex={ex}
                    added={addedIds.has(ex.id)}
                    adding={addingId === ex.id}
                    onAdd={() => startAdd(ex)}
                  />
                )}
              />
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {showScopePicker && (
              <motion.div
                className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  className="absolute inset-0 bg-black/60"
                  aria-label="Dismiss"
                  onClick={() => setPendingAdd(null)}
                />
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  className="relative z-10 w-full max-w-sm rounded-t-3xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl sm:rounded-3xl"
                >
                  <h3 className="text-center text-lg font-extrabold text-zinc-50">
                    Add {pendingAdd.exerciseName}?
                  </h3>
                  <p className="mt-1 text-center text-xs text-zinc-500">
                    Choose where this exercise should live
                  </p>
                  <motion.div layout className="mt-4 space-y-3">
                    <button
                      type="button"
                      disabled={addingId != null}
                      onClick={chooseSession}
                      className={cn(
                        "flex w-full flex-col items-start gap-2 rounded-2xl border px-4 py-4 text-left transition-colors",
                        "border-zinc-700/80 bg-zinc-900/60 hover:border-zinc-600"
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                        <Calendar className="h-5 w-5 text-zinc-400" />
                        This session only
                      </span>
                      <span className="text-xs text-zinc-500">
                        Today&apos;s workout only — plan stays the same.
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={addingId != null}
                      onClick={choosePlan}
                      className={cn(
                        "flex w-full flex-col items-start gap-2 rounded-2xl border px-4 py-4 text-left transition-colors",
                        "border-emerald-900/50 bg-emerald-950/30 hover:border-emerald-700/60"
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-emerald-200">
                        <BookmarkPlus className="h-5 w-5 text-emerald-400" />
                        Add to plan permanently
                      </span>
                      <span className="text-xs text-emerald-300/70">
                        Stays on {planName ?? "this plan"} for all future workouts.
                      </span>
                    </button>
                  </motion.div>
                  <Button
                    variant="ghost"
                    className="mt-3 h-12 w-full text-zinc-400"
                    onClick={() => setPendingAdd(null)}
                  >
                    Cancel
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {showPlanConfirm && (
              <motion.div
                className="fixed inset-0 z-[110] flex items-center justify-center p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  className="absolute inset-0 bg-black/60"
                  aria-label="Dismiss"
                  onClick={() => setPendingScope(null)}
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative z-10 w-full max-w-sm rounded-2xl border border-emerald-900/50 bg-zinc-900 p-5 shadow-xl"
                >
                  <p className="text-center text-sm font-semibold leading-relaxed text-emerald-100">
                    Add {pendingAdd.exerciseName} to {planName ?? "this plan"}{" "}
                    permanently? It will appear on every future day with this plan.
                  </p>
                  <motion.div layout className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      disabled={addingId != null}
                      onClick={() => setPendingScope(null)}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={addingId != null}
                      onClick={confirmPlan}
                    >
                      {addingId != null ? "…" : "Add permanently"}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
