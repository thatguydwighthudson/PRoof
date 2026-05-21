"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Link2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getExerciseProgress,
  type ExerciseProgressStatus,
} from "@/lib/workout/exercise-progress";
import { cn } from "@/lib/utils";

type ExerciseRow = {
  id: number;
  exerciseId: number;
  supersetGroupId: number | null;
  isUserAdded?: boolean;
  exercise: { name: string };
  sets: { isWarmup: boolean; isCompleted: boolean }[];
};

function statusMeta(
  index: number,
  currentIndex: number,
  progress: ExerciseProgressStatus
): { label: string; className: string } {
  if (index === currentIndex) {
    return {
      label: "Now",
      className: "bg-proof-500/20 text-proof-300",
    };
  }
  if (progress === "done") {
    return {
      label: "Done",
      className: "bg-proof-950/80 text-proof-400/90",
    };
  }
  if (progress === "partial") {
    return {
      label: "In progress",
      className: "bg-amber-500/15 text-amber-300",
    };
  }
  return {
    label: "Upcoming",
    className: "bg-charcoal-800 text-charcoal-500",
  };
}

export function ExerciseListSheet({
  open,
  onClose,
  exercises,
  currentIndex,
  onSelect,
  onRemove,
  onMove,
  onAddExercise,
  onManageSuperset,
}: {
  open: boolean;
  onClose: () => void;
  exercises: ExerciseRow[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onAddExercise: () => void;
  onManageSuperset: (index: number) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="All exercises"
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
            className="relative z-10 flex max-h-[min(85vh,640px)] w-full flex-col rounded-t-3xl border-t border-charcoal-700 bg-charcoal-950 shadow-2xl"
          >
            <div
              className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-charcoal-600"
              aria-hidden
            />

            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div>
                <h2 className="text-lg font-extrabold text-charcoal-50">
                  All exercises
                </h2>
                <p className="text-xs text-charcoal-500">
                  {exercises.length} in this session
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-charcoal-500 hover:bg-charcoal-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
              <ul className="space-y-2">
                {exercises.map((ex, i) => {
                  const progress = getExerciseProgress(ex.sets);
                  const meta = statusMeta(i, currentIndex, progress);
                  const canMoveUp = i > 0;
                  const canMoveDown = i < exercises.length - 1;

                  return (
                    <li
                      key={ex.id}
                      className={cn(
                        "rounded-2xl border bg-charcoal-900/80 p-3",
                        i === currentIndex
                          ? "border-proof-500/40"
                          : "border-charcoal-800"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(i);
                            onClose();
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                meta.className
                              )}
                            >
                              {meta.label}
                            </span>
                            {ex.supersetGroupId != null && (
                              <span className="text-[10px] font-bold uppercase text-violet-400">
                                SS
                              </span>
                            )}
                            {ex.isUserAdded && (
                              <span className="text-[10px] font-medium text-charcoal-500">
                                + you
                              </span>
                            )}
                          </div>
                          <p className="mt-1 font-bold text-charcoal-100">
                            {ex.exercise.name}
                          </p>
                        </button>
                        <div className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            disabled={!canMoveUp}
                            onClick={() => onMove(i, -1)}
                            className="rounded-lg border border-charcoal-800 p-1.5 text-charcoal-500 hover:bg-charcoal-800 disabled:opacity-30"
                            aria-label="Move up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!canMoveDown}
                            onClick={() => onMove(i, 1)}
                            className="rounded-lg border border-charcoal-800 p-1.5 text-charcoal-500 hover:bg-charcoal-800 disabled:opacity-30"
                            aria-label="Move down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {exercises.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 flex-1 border-violet-700/50 text-xs text-violet-300"
                            onClick={() => {
                              onManageSuperset(i);
                              onClose();
                            }}
                          >
                            <Link2 className="h-3 w-3" />
                            Superset
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemove(i)}
                          className="flex h-8 items-center justify-center gap-1 rounded-xl border border-charcoal-800 px-3 text-xs font-semibold text-charcoal-500 hover:border-red-900/50 hover:bg-red-950/30 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-charcoal-800 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                variant="outline"
                className="h-12 w-full border-dashed border-proof-600/50 bg-proof-950/20 text-base font-bold text-proof-300"
                onClick={() => {
                  onAddExercise();
                  onClose();
                }}
              >
                <Plus className="h-5 w-5" /> Add Exercise
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
