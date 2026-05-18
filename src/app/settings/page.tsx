"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { preferredUnit, setUnit } = useUser();
  const [reminderTime, setReminderTime] = useState("07:00");
  const [remindersOn, setRemindersOn] = useState(true);

  useEffect(() => {
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((d) => {
        if (d.remindTime) setReminderTime(d.remindTime.slice(0, 5));
        if (d.isActive != null) setRemindersOn(d.isActive);
      })
      .catch(() => {});
  }, []);

  const saveReminders = async () => {
    await fetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remindTime: reminderTime, isActive: remindersOn }),
    });
  };

  const exportJson = () => {
    window.location.href = "/api/export?format=json";
  };

  const exportCsv = () => {
    window.location.href = "/api/export?format=csv";
  };

  const subscribePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push not supported on this device");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const reg = await navigator.serviceWorker.register("/sw.js");
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) {
      alert("VAPID key not configured");
      return;
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
  };

  return (
    <div className="px-4 pt-6">
      <Link
        href="/today"
        className="mb-4 inline-flex items-center text-sm text-zinc-500"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <Card className="mb-4">
        <p className="mb-3 text-sm font-medium text-zinc-400">Units</p>
        <div className="flex gap-2">
          {(["lbs", "kg"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={cn(
                "flex-1 rounded-xl py-3 text-sm font-semibold",
                preferredUnit === u
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-800 text-zinc-400"
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <p className="mb-3 text-sm font-medium text-zinc-400">Reminders</p>
        <label className="mb-3 flex items-center justify-between">
          <span className="text-sm">Daily reminder</span>
          <input
            type="checkbox"
            checked={remindersOn}
            onChange={(e) => setRemindersOn(e.target.checked)}
          />
        </label>
        <input
          type="time"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2"
        />
        <Button className="mt-3 w-full" variant="secondary" onClick={saveReminders}>
          Save reminders
        </Button>
        <Button className="mt-2 w-full" variant="outline" onClick={subscribePush}>
          Enable push notifications
        </Button>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-medium text-zinc-400">Export</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={exportJson}>
            JSON
          </Button>
          <Button variant="secondary" className="flex-1" onClick={exportCsv}>
            CSV
          </Button>
        </div>
      </Card>

      <Link href="/body" className="mt-4 block">
        <Button variant="outline" className="w-full">
          Weekly body check-in
        </Button>
      </Link>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
