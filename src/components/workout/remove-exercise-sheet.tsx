"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RemoveExerciseTarget = {
  sessionExerciseId: number;
  exerciseName: string;
  loggedSetCount: number;
};

type PendingAction = "session" | "plan" | null;

export function RemoveExerciseSheet({
  open,
  onClose,
  sessionId,
  planId,
  planName,
  target,
  onRemoved,
}: {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  planId: number | null;
  planName: string | null;
  target: RemoveExerciseTarget | null;
  onRemoved: (scope: "session" | "plan", planName?: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [removing, setRemoving] = useState(false);
  const [confirmLogged, setConfirmLogged] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setPending(null);
      setConfirmLogged(false);
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

  const executeRemove = async (scope: "session" | "plan") => {
    if (!target || removing) return;
    setRemoving(true);
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/exercises/${target.sessionExerciseId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope }),
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      onRemoved(scope, data.planName);
      onClose();
    } finally {
      setRemoving(false);
      setPending(null);
      setConfirmLogged(false);
    }
  };

  const chooseSession = () => {
    if (!target) return;
    if (target.loggedSetCount > 0) {
      setPending("session");
      setConfirmLogged(true);
      return;
    }
    void executeRemove("session");
  };

  const choosePlan = () => {
    if (!target || planId == null) return;
    setPending("plan");
    setConfirmLogged(false);
  };

  const confirmPlan = () => {
    void executeRemove("plan");
  };

  if (!mounted) return null;

  const showPlanConfirm = pending === "plan" && target != null;
  const showLoggedConfirm = confirmLogged && pending === "session" && target != null;

  return createPortal(
    <AnimatePresence>
      {open && target && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Remove ${target.exerciseName}`}
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
            className="relative z-10 w-full rounded-t-3xl border-t border-zinc-700 bg-zinc-950 shadow-2xl"
          >
            <motion.div
              className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-zinc-600"
              aria-hidden
            />

            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <h2 className="text-lg font-extrabold text-zinc-50">
                Remove {target.exerciseName}?
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <motion.div layout className="space-y-3 px-4 pb-4">
              <button
                type="button"
                disabled={removing}
                onClick={chooseSession}
                className={cn(
                  "flex w-full flex-col items-start gap-2 rounded-2xl border px-4 py-4 text-left transition-colors",
                  "border-zinc-700/80 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-900"
                )}
              >
                <span className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                  <Calendar className="h-5 w-5 text-zinc-400" />
                  Remove for this session only
                </span>
                <span className="text-xs leading-relaxed text-zinc-500">
                  Drops this exercise from today&apos;s workout. Your plan stays
                  the same for next time.
                </span>
              </button>

              {planId != null && (
                <button
                  type="button"
                  disabled={removing}
                  onClick={choosePlan}
                  className={cn(
                    "flex w-full flex-col items-start gap-2 rounded-2xl border px-4 py-4 text-left transition-colors",
                    "border-red-900/50 bg-red-950/30 hover:border-red-700/60 hover:bg-red-950/50"
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-red-200">
                    <Trash2 className="h-5 w-5 text-red-400" />
                    Remove permanently from this plan
                  </span>
                  <span className="text-xs leading-relaxed text-red-300/70">
                    Removes from {planName ?? "this plan"} for all future
                    sessions and today&apos;s workout.
                  </span>
                </button>
              )}
            </motion.div>

            <motion.div layout className="px-4 pb-8">
              <Button
                variant="ghost"
                className="h-12 w-full text-base font-semibold text-zinc-400"
                onClick={onClose}
                disabled={removing}
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {showLoggedConfirm && (
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
                  onClick={() => {
                    setConfirmLogged(false);
                    setPending(null);
                  }}
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl"
                >
                  <p className="text-center text-sm font-semibold text-zinc-100">
                    You&apos;ve already logged {target.loggedSetCount}{" "}
                    {target.loggedSetCount === 1 ? "set" : "sets"}. Remove
                    anyway?
                  </p>
                  <motion.div layout className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      disabled={removing}
                      onClick={() => {
                        setConfirmLogged(false);
                        setPending(null);
                      }}
                    >
                      Keep
                    </Button>
                    <Button
                      className="flex-1 bg-zinc-700 hover:bg-zinc-600"
                      disabled={removing}
                      onClick={() => executeRemove("session")}
                    >
                      {removing ? "…" : "Remove"}
                    </Button>
                  </motion.div>
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
                  onClick={() => setPending(null)}
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative z-10 w-full max-w-sm rounded-2xl border border-red-900/50 bg-zinc-900 p-5 shadow-xl"
                >
                  <p className="text-center text-sm font-semibold leading-relaxed text-red-100">
                    This will remove {target.exerciseName} from{" "}
                    {planName ?? "this plan"} permanently. This cannot be undone.
                  </p>
                  {target.loggedSetCount > 0 && (
                    <p className="mt-2 text-center text-xs text-zinc-500">
                      {target.loggedSetCount} logged{" "}
                      {target.loggedSetCount === 1 ? "set" : "sets"} will be
                      deleted too.
                    </p>
                  )}
                  <motion.div layout className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      disabled={removing}
                      onClick={() => setPending(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-500"
                      disabled={removing}
                      onClick={confirmPlan}
                    >
                      {removing ? "…" : "Remove permanently"}
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
