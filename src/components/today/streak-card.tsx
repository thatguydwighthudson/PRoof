"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/ui/section-label";
import { StreakCardSkeleton } from "@/components/today/today-skeletons";
import { completionDateKey, parseLogDate } from "@/lib/session-log-date";
import { cn } from "@/lib/utils";

type SessionRow = { endedAt: string };

function computeStreak(dates: string[]): { count: number; active: boolean } {
  if (dates.length === 0) return { count: 0, active: false };

  const unique = [...new Set(dates.map((d) => d.slice(0, 10)))].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const cursor = new Date(today);

  const latest = parseLogDate(unique[0]);
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

function countWeekSessions(sessions: SessionRow[], weekAgoMs: number): number {
  return sessions.filter(
    (s) => new Date(s.endedAt).getTime() >= weekAgoMs
  ).length;
}

export function StreakCard() {
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);
  const [weekSessions, setWeekSessions] = useState(0);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => {
        const sessions: SessionRow[] = (d.sessions ?? []).filter(
          (s: { endedAt?: string | null }) => s.endedAt
        );
        const dates = sessions.map((s) => completionDateKey(s.endedAt));
        const streak = computeStreak(dates);
        const weekAgoMs = Date.now() - 7 * 86400000;
        setCount(streak.count);
        setActive(streak.active);
        setWeekSessions(countWeekSessions(sessions, weekAgoMs));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <StreakCardSkeleton />;
  }

  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      <div
        className={cn(
          "col-span-1 rounded-2xl p-4 ring-1",
          active
            ? "bg-gradient-to-br from-orange-500/20 to-red-600/10 ring-orange-500/30"
            : "bg-charcoal-900/80 ring-charcoal-800"
        )}
      >
        <SectionLabel>This streak</SectionLabel>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-4xl">{active ? "🔥" : "❄️"}</span>
          <span className="text-4xl font-black tabular-nums">{count}</span>
        </div>
        <p className="mt-1 text-xs text-charcoal-500">
          {active ? "days in a row" : "start today"}
        </p>
      </div>
      <div className="rounded-2xl bg-charcoal-900/80 p-4 ring-1 ring-charcoal-800">
        <SectionLabel>This week</SectionLabel>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-2xl">📅</span>
          <span className="text-4xl font-black tabular-nums">{weekSessions}</span>
        </div>
        <p className="mt-1 text-xs text-charcoal-500">completed sessions</p>
      </div>
    </div>
  );
}
