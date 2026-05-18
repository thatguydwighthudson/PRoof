"use client";

import { useState } from "react";
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="w-full rounded-t-3xl border-t border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-bold">Plate Calculator</h2>
        <p className="text-xs text-zinc-500">45 lb bar — per side</p>
        <Input
          type="number"
          placeholder="Target weight (lbs)"
          className="mt-4"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        {result && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-zinc-400">
              Loaded: <span className="text-zinc-100">{result.totalLoaded} lbs</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {result.perSide.length === 0 ? (
                <span className="text-zinc-500">Bar only</span>
              ) : (
                result.perSide.map((p, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-emerald-600/20 px-3 py-1 text-sm font-medium text-emerald-300"
                  >
                    {p}
                  </span>
                ))
              )}
            </div>
            <p className="text-xs text-zinc-600">each side</p>
          </div>
        )}
        <Button className="mt-6 w-full" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
