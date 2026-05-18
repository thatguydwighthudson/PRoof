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
    <div className="px-4 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Welcome back</p>
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
        </div>
        <Link
          href="/settings"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400"
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
