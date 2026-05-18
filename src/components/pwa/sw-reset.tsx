"use client";

import { useEffect } from "react";

/**
 * Visit any page with ?reset-sw=1 to clear broken service workers (e.g. stuck iOS PWA).
 */
export function SwReset() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("reset-sw") !== "1") return;

    void (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      } catch {
        /* ignore */
      }
      params.delete("reset-sw");
      const qs = params.toString();
      const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState(null, "", next);
      window.location.reload();
    })();
  }, []);

  return null;
}
