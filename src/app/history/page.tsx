"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format, startOfWeek, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { getPlanTheme } from "@/lib/ui/plan-theme";
import { cn } from "@/lib/utils";

type SessionRow = {
  id: number;
  sessionDate: string;
  planName: string;
  durationMins: number | null;
  isDeload: boolean;
  exerciseCount: number;
};

type WeekGroup = {
  key: string;
  label: string;
  sessions: SessionRow[];
};

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []));
  }, []);

  const weekGroups = useMemo((): WeekGroup[] => {
    const map = new Map<string, SessionRow[]>();
    for (const s of sessions) {
      const d = parseISO(
        s.sessionDate.includes("T") ? s.sessionDate : `${s.sessionDate}T12:00:00`
      );
      const weekStart = startOfWeek(d, { weekStartsOn: 1 });
      const key = format(weekStart, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, list]) => ({
        key,
        label: `Week of ${format(parseISO(`${key}T12:00:00`), "MMM d")}`,
        sessions: list,
      }));
  }, [sessions]);

  const repeat = async (id: number) => {
    const res = await fetch("/api/sessions/clone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceSessionId: id }),
    });
    const data = await res.json();
    router.push(`/workout/${data.id}`);
  };

  return (
    <div className="bg-mesh min-h-screen px-4 pt-6">
      <h1 className="mb-1 text-3xl font-extrabold tracking-tight">History 📅</h1>
      <p className="mb-6 text-sm text-zinc-500">Your training logbook</p>

      <div className="space-y-8">
        {weekGroups.map((week) => (
          <section key={week.key}>
            <div className="mb-3 flex items-end justify-between">
              <SectionLabel>{week.label}</SectionLabel>
              <span className="text-xs font-bold text-zinc-500">
                {week.sessions.length} session
                {week.sessions.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-3">
              {week.sessions.map((s) => {
                const theme = getPlanTheme(s.planName);
                return (
                  <Card
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "cursor-pointer border-l-4 pl-4 transition hover:bg-zinc-900/80 active:scale-[0.99]",
                      theme.border
                    )}
                    onClick={() => router.push(`/history/${s.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/history/${s.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-extrabold text-zinc-50">
                          {theme.emoji} {s.planName}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-zinc-400">
                          {s.sessionDate}
                        </p>
                      </div>
                      {s.isDeload && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          😴 DELOAD
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      <span className="rounded-lg bg-zinc-800 px-2 py-1">
                        <span className="font-bold text-zinc-200">
                          {s.exerciseCount}
                        </span>{" "}
                        <span className="text-zinc-500">exercises</span>
                      </span>
                      {s.durationMins != null && (
                        <span className="rounded-lg bg-zinc-800 px-2 py-1">
                          <span className="font-bold text-zinc-200">
                            {s.durationMins}
                          </span>{" "}
                          <span className="text-zinc-500">min</span>
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4 w-full border-zinc-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        repeat(s.id);
                      }}
                    >
                      🔁 Repeat This Workout
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
        {sessions.length === 0 && (
          <Card className="py-12 text-center">
            <span className="text-4xl">📭</span>
            <p className="mt-3 text-zinc-500">No sessions yet. Start on Today 🏋️</p>
          </Card>
        )}
      </div>
    </div>
  );
}
