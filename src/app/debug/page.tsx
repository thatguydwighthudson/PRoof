"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Diagnostics = Record<string, unknown>;

export default function DebugPage() {
  const [info, setInfo] = useState<Diagnostics | null>(null);
  const [step, setStep] = useState("starting");

  useEffect(() => {
    const run = async () => {
      const base: Diagnostics = {
        href: window.location.href,
        buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? "unknown",
        userAgent: navigator.userAgent,
        standalone: window.matchMedia("(display-mode: standalone)").matches,
        onLine: navigator.onLine,
      };

      setStep("service-worker");
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          base.serviceWorkers = regs.map((r) => ({
            scope: r.scope,
            active: r.active?.scriptURL ?? null,
          }));
        } else {
          base.serviceWorkers = "unsupported";
        }
      } catch (e) {
        base.serviceWorkerError = e instanceof Error ? e.message : String(e);
      }

      setStep("health");
      try {
        const health = await fetch("/api/health", { cache: "no-store" });
        base.healthStatus = health.status;
        base.health = await health.json();
      } catch (e) {
        base.healthError = e instanceof Error ? e.message : String(e);
      }

      setStep("done");
      setInfo(base);
    };

    void run();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-zinc-100">
      <h1 className="text-xl font-bold">PRoof debug</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Step: {step}. Screenshot this and share if /today still fails.
      </p>
      <Link
        href="/today"
        className="mt-4 inline-block text-sm text-emerald-400"
      >
        ← Try Today
      </Link>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-300">
        {info ? JSON.stringify(info, null, 2) : `Running checks… (${step})`}
      </pre>
    </div>
  );
}
