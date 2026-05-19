"use client";

import { motion } from "framer-motion";
import { Maximize2, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

export function RestTimerMinimized({
  seconds,
  total,
  onExpand,
  onSkip,
}: {
  seconds: number;
  total: number;
  onExpand: () => void;
  onSkip: () => void;
}) {
  const pct = total > 0 ? seconds / total : 0;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-24 left-4 right-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-emerald-500/40 bg-zinc-950/95 px-4 py-3 shadow-lg shadow-emerald-900/30 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onExpand}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label="Expand rest timer"
      >
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          Rest
        </span>
        <span
          className={cn(
            "text-2xl font-black tabular-nums",
            pct > 0.5
              ? "text-emerald-400"
              : pct > 0.2
                ? "text-amber-400"
                : "text-red-400"
          )}
        >
          {Math.max(0, seconds)}s
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={false}
            animate={{ width: `${Math.max(0, Math.min(100, pct * 100))}%` }}
          />
        </div>
        <Maximize2 className="h-4 w-4 shrink-0 text-zinc-500" />
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        aria-label="Skip rest"
      >
        <SkipForward className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
