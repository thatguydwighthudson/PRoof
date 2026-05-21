"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";
import { AccountSettings } from "@/components/settings/account-settings";

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
    <div className="bg-mesh min-h-screen px-4 pt-6">
      <Link
        href="/today"
        className="mb-4 inline-flex items-center text-sm font-medium text-charcoal-500"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Settings ⚙️</h1>

      <Card className="mb-4">
        <SectionLabel>Units</SectionLabel>
        <div className="mt-3 flex gap-2">
          {(["lbs", "kg"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={cn(
                "flex-1 rounded-xl py-3 text-sm font-bold uppercase tracking-wide",
                preferredUnit === u
                  ? "bg-proof-600 text-white shadow-lg shadow-proof-600/25"
                  : "bg-charcoal-800 text-charcoal-400"
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <SectionLabel>Reminders</SectionLabel>
        <label className="mb-3 mt-3 flex items-center justify-between">
          <span className="text-sm font-medium">🔔 Daily reminder</span>
          <input
            type="checkbox"
            checked={remindersOn}
            onChange={(e) => setRemindersOn(e.target.checked)}
            className="h-5 w-5 accent-proof-500"
          />
        </label>
        <input
          type="time"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="w-full rounded-xl border border-charcoal-700 bg-charcoal-950 px-3 py-3 font-medium"
        />
        <Button className="mt-3 w-full" variant="secondary" onClick={saveReminders}>
          Save reminders
        </Button>
        <Button className="mt-2 w-full" variant="outline" onClick={subscribePush}>
          Enable push notifications
        </Button>
      </Card>

      <Card>
        <SectionLabel>Export</SectionLabel>
        <p className="mt-2 mb-3 text-xs text-charcoal-500">Download your training data</p>
        <Button
          variant="secondary"
          className="mb-2 w-full font-bold"
          onClick={exportJson}
        >
          📤 Export My Data (JSON)
        </Button>
        <Button variant="outline" className="w-full" onClick={exportCsv}>
          📊 Session history (CSV)
        </Button>
      </Card>

      <AccountSettings />

      <Link href="/body" className="mt-4 block">
        <Button
          variant="outline"
          className="h-14 w-full border-charcoal-700 text-base font-bold"
        >
          ⚖️ Weekly Check-In
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
