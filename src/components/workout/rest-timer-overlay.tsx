"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EyeOff, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

export function RestTimerOverlay({
  seconds,
  total,
  onSkip,
  onHide,
}: {
  seconds: number;
  total: number;
  onSkip: () => void;
  onHide: () => void;
}) {
  const [done, setDone] = useState(false);
  const progress = total > 0 ? seconds / total : 0;
  const pct = Math.max(0, Math.min(1, progress));
  const circumference = 2 * Math.PI * 120;
  const offset = circumference * (1 - pct);

  const ringColor =
    pct > 0.5 ? "stroke-emerald-400" : pct > 0.2 ? "stroke-amber-400" : "stroke-red-500";

  useEffect(() => {
    if (seconds <= 0) {
      setDone(true);
      const t = setTimeout(() => setDone(false), 800);
      return () => clearTimeout(t);
    }
    setDone(false);
  }, [seconds]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <div className="relative flex flex-col items-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
          Rest
        </p>
        <div className="relative flex h-72 w-72 items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 260 260">
            <circle
              cx="130"
              cy="130"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-zinc-800"
            />
            <circle
              cx="130"
              cy="130"
              r="120"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn("transition-all duration-1000 ease-linear", ringColor)}
            />
          </svg>
          <div className="text-center">
            <motion.span
              key={done ? "done" : "rest"}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-2 block text-5xl"
            >
              {done || seconds <= 0 ? "💪" : "😤"}
            </motion.span>
            <span
              className={cn(
                "block text-8xl font-black tabular-nums tracking-tighter",
                pct > 0.5
                  ? "text-emerald-400"
                  : pct > 0.2
                    ? "text-amber-400"
                    : "text-red-400"
              )}
            >
              {Math.max(0, seconds)}
            </span>
          </div>
        </div>
        <motion.div layout className="mt-8 flex flex-col gap-2">
          <Button
            variant="outline"
            className="animate-[shake_0.5s_ease-in-out]"
            onClick={onHide}
          >
            <EyeOff className="h-4 w-4" /> Hide (keep counting)
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            <SkipForward className="h-4 w-4" /> Skip rest
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
