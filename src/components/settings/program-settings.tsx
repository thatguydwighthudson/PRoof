"use client";

import { useActionState, useEffect, useState } from "react";
import {
  restartAtWeek1,
  type ProgramFormState,
} from "@/app/actions/program";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

type ProgramDayOption = {
  dayNumber: number;
  label: string | null;
  restDay: boolean;
  planName: string | null;
};

function dayLabel(day: ProgramDayOption) {
  const name = day.label ?? day.planName;
  if (day.restDay) {
    return name ? `Day ${day.dayNumber} · Rest (${name})` : `Day ${day.dayNumber} · Rest`;
  }
  return name ? `Day ${day.dayNumber} · ${name}` : `Day ${day.dayNumber}`;
}

export function ProgramSettings() {
  const [days, setDays] = useState<ProgramDayOption[]>([]);
  const [dayNumber, setDayNumber] = useState(1);
  const [loaded, setLoaded] = useState(false);

  const [state, action, pending] = useActionState(
    restartAtWeek1,
    {} as ProgramFormState
  );

  useEffect(() => {
    fetch("/api/program")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.days?.length) {
          setDays(data.days);
          setDayNumber(data.days[0].dayNumber);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <Card className="mb-4">
      <SectionLabel>Program</SectionLabel>
      <p className="mt-2 mb-3 text-xs text-charcoal-500">
        Coming back after a break? Start again at Week 1 on any day. Completed
        workouts stay in history; any in-progress workout is cleared.
      </p>

      {!loaded ? (
        <p className="text-sm text-charcoal-500">Loading program…</p>
      ) : days.length === 0 ? (
        <p className="text-sm text-charcoal-500">No active program found.</p>
      ) : (
        <form action={action} className="space-y-3">
          {state.success && (
            <p className="rounded-xl bg-proof-950/50 px-3 py-2 text-xs font-medium text-proof-400">
              {state.success}
            </p>
          )}
          {state.errors?.form && (
            <p className="text-xs font-medium text-red-400">{state.errors.form}</p>
          )}
          <div>
            <label
              htmlFor="restart-day"
              className="text-xs font-bold uppercase tracking-wider text-charcoal-500"
            >
              Start on day
            </label>
            <select
              id="restart-day"
              name="day_number"
              value={dayNumber}
              onChange={(e) => setDayNumber(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-charcoal-700 bg-charcoal-950 px-3 py-3 font-medium"
            >
              {days.map((day) => (
                <option key={day.dayNumber} value={day.dayNumber}>
                  {dayLabel(day)}
                </option>
              ))}
            </select>
            {state.errors?.day_number && (
              <p className="mt-1 text-xs font-medium text-red-400">
                {state.errors.day_number}
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={pending}
            onClick={(e) => {
              if (
                !confirm(
                  `Reset to Week 1 · Day ${dayNumber}? Completed workouts stay; any in-progress workout is cleared.`
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            {pending ? "Resetting…" : `Restart at Week 1 · Day ${dayNumber}`}
          </Button>
        </form>
      )}
    </Card>
  );
}
