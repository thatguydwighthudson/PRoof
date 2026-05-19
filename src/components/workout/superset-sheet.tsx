"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Unlink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SupersetSheetTarget = {
  sessionExerciseId: number;
  exerciseName: string;
  supersetGroupId: number | null;
};

type PartnerOption = {
  sessionExerciseId: number;
  exerciseName: string;
  supersetGroupId: number | null;
};

export function SupersetSheet({
  open,
  onClose,
  sessionId,
  target,
  partners,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  target: SupersetSheetTarget | null;
  partners: PartnerOption[];
  onChanged: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const linkWith = async (partnerSessionExerciseId: number) => {
    if (!target || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/superset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anchorSessionExerciseId: target.sessionExerciseId,
          partnerSessionExerciseId,
        }),
      });
      if (res.ok) {
        onChanged();
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    if (!target || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/superset`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionExerciseId: target.sessionExerciseId }),
      });
      if (res.ok) {
        onChanged();
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!mounted) return null;

  const inSuperset = target?.supersetGroupId != null;
  const available = partners.filter((p) => {
    if (!target) return false;
    if (p.sessionExerciseId === target.sessionExerciseId) return false;
    if (
      inSuperset &&
      p.supersetGroupId === target.supersetGroupId
    ) {
      return false;
    }
    return true;
  });

  return createPortal(
    <AnimatePresence>
      {open && target && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Superset for ${target.exerciseName}`}
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
            className="relative z-10 max-h-[70vh] w-full rounded-t-3xl border-t border-zinc-700 bg-zinc-950 shadow-2xl"
          >
            <motion.div
              className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-zinc-600"
              aria-hidden
            />

            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <h2 className="text-lg font-extrabold text-zinc-50">
                Superset — {target.exerciseName}
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

            <div className="space-y-3 overflow-y-auto px-4 pb-8">
              {inSuperset && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void unlink()}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors",
                    "border-violet-800/50 bg-violet-950/30 hover:bg-violet-950/50"
                  )}
                >
                  <Unlink className="h-5 w-5 shrink-0 text-violet-400" />
                  <span className="text-sm font-bold text-violet-100">
                    Remove superset link
                  </span>
                </button>
              )}

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {inSuperset ? "Add another partner" : "Superset with"}
              </p>

              {available.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">
                  No other exercises available to pair.
                </p>
              ) : (
                available.map((p) => (
                  <button
                    key={p.sessionExerciseId}
                    type="button"
                    disabled={busy}
                    onClick={() => void linkWith(p.sessionExerciseId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors",
                      "border-zinc-700/80 bg-zinc-900/60 hover:border-violet-600/50 hover:bg-zinc-900"
                    )}
                  >
                    <Link2 className="h-5 w-5 shrink-0 text-violet-400" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-100">
                      {p.exerciseName}
                    </span>
                    {p.supersetGroupId != null && (
                      <span className="text-[10px] font-bold uppercase text-violet-400">
                        In SS
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="px-4 pb-8">
              <Button
                variant="ghost"
                className="h-12 w-full text-base font-semibold text-zinc-400"
                onClick={onClose}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
