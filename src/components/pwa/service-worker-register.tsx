"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

/**
 * Registers the push SW with cache-busting and applies updates without a hard refresh.
 * App JS/CSS is already content-hashed by Next under /_next/static.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloaded = false;

    const reloadOnce = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };

    const onControllerChange = () => {
      reloadOnce();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register(
          `/sw.js?build=${encodeURIComponent(BUILD_ID)}`,
          { scope: "/", updateViaCache: "none" }
        );

        const activateWaiting = (worker: ServiceWorker) => {
          if (worker.state === "activated") {
            reloadOnce();
            return;
          }
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated") reloadOnce();
          });
          worker.postMessage({ type: "SKIP_WAITING" });
        };

        const onUpdateFound = () => {
          const installing = reg.installing;
          if (!installing) return;

          installing.addEventListener("statechange", () => {
            if (installing.state !== "installed") return;
            if (!navigator.serviceWorker.controller) return;

            toast("Update available", {
              description: "Refreshing to load the latest version…",
              duration: 2500,
            });
            activateWaiting(installing);
          });
        };

        reg.addEventListener("updatefound", onUpdateFound);

        if (reg.waiting && navigator.serviceWorker.controller) {
          activateWaiting(reg.waiting);
        }

        await reg.update();
      } catch {
        /* SW optional — push may be unavailable */
      }
    };

    void register();

    const checkForUpdates = () => {
      void navigator.serviceWorker.getRegistration().then((reg) => reg?.update());
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdates();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", checkForUpdates);

    const interval = window.setInterval(checkForUpdates, 60 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", checkForUpdates);
      window.clearInterval(interval);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, []);

  return null;
}
