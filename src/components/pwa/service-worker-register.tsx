"use client";

import { useEffect } from "react";

/** Registers push SW once. No reloads, no update loops — safe for mobile Safari/PWA. */
export function registerPushServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register("/sw.js").catch(() => {});
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    registerPushServiceWorker();
  }, []);

  return null;
}
