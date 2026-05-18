export const dynamic = "force-dynamic";

import Link from "next/link";
import { Settings } from "lucide-react";
import { TodayClient } from "@/components/today/today-client";
import { getTodayPlan } from "@/lib/services/program";
import { getActiveSessionOrNull } from "@/lib/services/session";

export default async function TodayPage() {
  const today = await getTodayPlan();
  const active = await getActiveSessionOrNull();

  return (
    <div className="bg-mesh min-h-screen px-4 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            PRoof
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Today 🏋️
          </h1>
        </div>
        <Link
          href="/settings"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900/80 text-zinc-400 ring-1 ring-zinc-800 transition hover:text-emerald-400"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </header>
      <TodayClient
        initialToday={today}
        activeSessionId={active?.id ?? null}
      />
    </div>
  );
}
