"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { MUSCLE_DOT, groupByMuscleGroup } from "@/lib/exercise-muscle-groups";
import { cn } from "@/lib/utils";

export function MuscleGroupAccordion<
  T extends { muscleGroupName: string | null; id?: number },
>({
  items,
  renderItem,
  isSearching = false,
  emptyMessage = "No exercises match",
  className,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  isSearching?: boolean;
  emptyMessage?: string;
  className?: string;
}) {
  const sections = useMemo(() => groupByMuscleGroup(items), [items]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isSearching) return;
    const next: Record<string, boolean> = {};
    for (const { group } of sections) {
      next[group] = true;
    }
    setOpenGroups((prev) => ({ ...prev, ...next }));
  }, [isSearching, sections]);

  const toggle = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  if (sections.length === 0) {
    return (
      <Card className={cn("py-10 text-center", className)}>
        <span className="text-3xl">🔍</span>
        <p className="mt-2 text-sm text-zinc-400">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <motion.div layout className={cn("space-y-2", className)}>
      {sections.map(({ group, items: groupItems }) => {
        const open = openGroups[group] ?? false;
        const dot = MUSCLE_DOT[group] ?? "bg-zinc-500";

        return (
          <Card key={group} className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => toggle(group)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-800/50"
              aria-expanded={open}
            >
              <span className={cn("h-3 w-3 shrink-0 rounded-full", dot)} />
              <span className="flex-1 font-bold text-zinc-100">{group}</span>
              <span className="text-xs font-medium text-zinc-500">
                {groupItems.length}
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-zinc-800/80"
                >
                  <div className="space-y-2 p-3 pt-2">
                    {groupItems.map((item) => (
                      <div key={item.id ?? `${group}-${String(item)}`}>
                        {renderItem(item)}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </motion.div>
  );
}
