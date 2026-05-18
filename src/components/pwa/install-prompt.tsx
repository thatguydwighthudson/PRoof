"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-30 mx-auto max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
      <p className="text-sm font-medium">Install PRoof</p>
      <p className="mt-1 text-xs text-zinc-500">
        Add to your home screen for the full app experience.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
          }}
        >
          Install
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDismissed(true)}
        >
          Later
        </Button>
      </div>
    </div>
  );
}
