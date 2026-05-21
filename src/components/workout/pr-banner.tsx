"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export function PrBanner({
  show,
  detail,
  onDismiss,
}: {
  show: boolean;
  detail: string | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.35 },
      colors: ["#fbbf24", "#0088FF", "#FFFFFF"],
    });
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && detail && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed left-0 right-0 top-0 z-[60] mx-auto max-w-lg px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/25 via-amber-600/20 to-charcoal-900 px-4 py-4 shadow-lg shadow-amber-500/20">
            <span className="animate-bounce text-3xl">🏆</span>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-amber-200">
                New Personal Record!
              </p>
              <p className="text-xs text-amber-100/80">{detail}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
