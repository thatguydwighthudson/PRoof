"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SessionRow = {
  id: number;
  sessionDate: string;
  planName: string;
  durationMins: number | null;
  isDeload: boolean;
  exerciseCount: number;
};

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []));
  }, []);

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
    <div className="px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold">History</h1>
      <div className="space-y-3">
        {sessions.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{s.planName}</p>
                <p className="text-sm text-zinc-500">{s.sessionDate}</p>
                <p className="text-xs text-zinc-600">
                  {s.exerciseCount} exercises
                  {s.durationMins ? ` · ${s.durationMins} min` : ""}
                  {s.isDeload ? " · Deload" : ""}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => repeat(s.id)}>
                Repeat This Workout
              </Button>
            </div>
          </Card>
        ))}
        {sessions.length === 0 && (
          <p className="text-center text-zinc-500">No sessions yet.</p>
        )}
      </div>
    </div>
  );
}
