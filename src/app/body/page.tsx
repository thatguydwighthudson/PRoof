"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { inputToKg, displayWeightValue } from "@/lib/units";

export default function BodyCheckInPage() {
  const { preferredUnit } = useUser();
  const [weight, setWeight] = useState("");
  const [history, setHistory] = useState<
    { loggedDate: string; weightKg: number | null }[]
  >([]);

  useEffect(() => {
    fetch("/api/body")
      .then((r) => r.json())
      .then((d) => setHistory(d.metrics ?? []));
  }, []);

  const save = async () => {
    const w = parseFloat(weight);
    if (!w) return;
    await fetch("/api/body", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg: inputToKg(w, preferredUnit) }),
    });
    const res = await fetch("/api/body");
    const d = await res.json();
    setHistory(d.metrics ?? []);
    setWeight("");
  };

  return (
    <div className="bg-mesh min-h-screen px-4 pt-6">
      <Link
        href="/settings"
        className="mb-4 inline-flex items-center text-sm font-medium text-charcoal-500"
      >
        <ChevronLeft className="h-4 w-4" /> Settings
      </Link>
      <h1 className="mb-1 text-3xl font-extrabold tracking-tight">
        ⚖️ Weekly Check-In
      </h1>
      <p className="mb-6 text-sm text-charcoal-500">Track the trend, not just the day</p>
      <Card className="mb-6 border-charcoal-700/80">
        <SectionLabel>Body weight</SectionLabel>
        <label className="mt-3 block text-sm text-charcoal-400">
          Weight ({preferredUnit})
        </label>
        <Input
          type="number"
          step="0.1"
          className="mt-2 border-charcoal-700 bg-charcoal-950 text-2xl font-bold"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="0.0"
        />
        <Button className="mt-4 h-12 w-full text-base font-bold" onClick={save}>
          Save check-in ✓
        </Button>
      </Card>
      <SectionLabel>History</SectionLabel>
      <ul className="mt-3 space-y-2">
        {history.map((m) => (
          <li
            key={m.loggedDate}
            className="flex justify-between rounded-2xl border border-charcoal-800 bg-charcoal-900/80 px-4 py-3"
          >
            <span className="text-sm text-charcoal-400">{m.loggedDate}</span>
            <span className="text-lg font-extrabold tabular-nums text-charcoal-100">
              {m.weightKg != null
                ? `${displayWeightValue(m.weightKg, preferredUnit)} ${preferredUnit}`
                : "—"}
            </span>
          </li>
        ))}
        {history.length === 0 && (
          <li className="py-8 text-center text-sm text-charcoal-500">
            No check-ins yet
          </li>
        )}
      </ul>
    </div>
  );
}
