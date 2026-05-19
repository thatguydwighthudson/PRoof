"use client";

import { motion } from "framer-motion";
import { Watch } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WearableNotice({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
      >
        <motion.div
          layout
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400"
        >
          <Watch className="h-8 w-8" />
        </motion.div>
        <h2 className="mt-4 text-center text-xl font-extrabold text-zinc-50">
          Start your wearable
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-zinc-400">
          Start a workout on your Apple Watch, Garmin, or other device now so
          heart rate and calories sync while you lift.
        </p>
        <Button className="mt-6 h-12 w-full text-base font-bold" onClick={onDismiss}>
          Got it — let&apos;s go
        </Button>
      </motion.div>
    </motion.div>
  );
}
