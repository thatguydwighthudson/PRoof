"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculatePlates } from "@/lib/services/plates";

export function PlateCalculator({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [target, setTarget] = useState("");
  const result = target ? calculatePlates(parseFloat(target) || 0) : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            className="w-full rounded-t-3xl border-t border-charcoal-700 bg-charcoal-900 p-6"
          >
            <h2 className="text-xl font-extrabold">🧮 Plate Calculator</h2>
            <p className="text-xs text-charcoal-500">45 lb bar — per side</p>
            <Input
              type="number"
              placeholder="Target weight (lbs)"
              className="mt-4 border-charcoal-700 bg-charcoal-950 text-lg font-bold"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            {result && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-charcoal-400">
                  Loaded:{" "}
                  <span className="text-2xl font-black text-proof-400">
                    {result.totalLoaded}
                  </span>{" "}
                  <span className="text-charcoal-500">lbs</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.perSide.length === 0 ? (
                    <span className="text-charcoal-500">Bar only</span>
                  ) : (
                    result.perSide.map((p, i) => (
                      <span
                        key={i}
                        className="rounded-xl bg-proof-600/25 px-3 py-2 text-sm font-bold text-proof-300 ring-1 ring-proof-500/30"
                      >
                        {p}
                      </span>
                    ))
                  )}
                </div>
                <p className="text-xs text-charcoal-600">each side</p>
              </div>
            )}
            <Button className="mt-6 h-12 w-full font-bold" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
