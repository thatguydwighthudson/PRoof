"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SESSION_KEY = "proof-install-banner-seen";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

function isInstallBannerSeen(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markInstallBannerSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [hidden, setHidden] = useState(() => isInstallBannerSeen());

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    markInstallBannerSeen();
    setHidden(true);
  };

  if (hidden || !deferred) return null;

  return (
    <div
      role="region"
      aria-label="Install PRoof"
      className="sticky top-0 z-50 -mx-4 border-b border-emerald-500/20 bg-zinc-950/95 px-4 py-3 backdrop-blur-xl"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">Install PRoof</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Add to your home screen for the full app experience.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Dismiss install banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={async () => {
            await deferred.prompt();
            markInstallBannerSeen();
            setDeferred(null);
            setHidden(true);
          }}
        >
          Install
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Later
        </Button>
      </div>
    </div>
  );
}
