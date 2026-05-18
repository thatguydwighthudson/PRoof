"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
    <div className="px-4 pt-6">
      <Link href="/settings" className="mb-4 inline-flex items-center text-sm text-zinc-500">
        <ChevronLeft className="h-4 w-4" /> Settings
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Body check-in</h1>
      <Card className="mb-6">
        <label className="text-sm text-zinc-400">Weight ({preferredUnit})</label>
        <Input
          type="number"
          step="0.1"
          className="mt-2"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <Button className="mt-4 w-full" onClick={save}>
          Save check-in
        </Button>
      </Card>
      <h2 className="mb-3 text-sm font-medium text-zinc-400">History</h2>
      <ul className="space-y-2">
        {history.map((m) => (
          <li
            key={m.loggedDate}
            className="flex justify-between rounded-xl bg-zinc-900 px-4 py-3 text-sm"
          >
            <span>{m.loggedDate}</span>
            <span>
              {m.weightKg != null
                ? `${displayWeightValue(m.weightKg, preferredUnit)} ${preferredUnit}`
                : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
