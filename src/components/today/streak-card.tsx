"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";

type SessionRow = { sessionDate: string };

function computeStreak(dates: string[]): { count: number; active: boolean } {
  if (dates.length === 0) return { count: 0, active: false };

  const unique = [...new Set(dates.map((d) => d.slice(0, 10)))].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = new Date(today);

  const latest = new Date(unique[0] + "T12:00:00");
  latest.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (today.getTime() - latest.getTime()) / (86400000)
  );
  if (diffDays > 1) return { count: 0, active: false };

  if (diffDays === 1) cursor.setDate(cursor.getDate() - 1);

  const set = new Set(unique);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { count: streak, active: streak > 0 };
}

export function StreakCard() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => {});
  }, []);

  const { count, active } = useMemo(
    () => computeStreak(sessions.map((s) => s.sessionDate)),
    [sessions]
  );

  const weekSessions = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return sessions.filter(
      (s) => new Date(s.sessionDate).getTime() >= weekAgo
    ).length;
  }, [sessions]);

  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      <div
        className={cn(
          "col-span-1 rounded-2xl p-4 ring-1",
          active
            ? "bg-gradient-to-br from-orange-500/20 to-red-600/10 ring-orange-500/30"
            : "bg-zinc-900/80 ring-zinc-800"
        )}
      >
        <SectionLabel>This streak</SectionLabel>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-4xl">{active ? "🔥" : "❄️"}</span>
          <span className="text-4xl font-black tabular-nums">{count}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {active ? "days in a row" : "start today"}
        </p>
      </div>
      <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
        <SectionLabel>This week</SectionLabel>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-2xl">📅</span>
          <span className="text-4xl font-black tabular-nums">{weekSessions}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">sessions</p>
      </div>
    </div>
  );
}
