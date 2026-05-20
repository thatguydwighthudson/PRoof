"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Toaster } from "sonner";

/** Minimal shell for /debug — no install prompt, nav, or toasts. */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDebug = pathname.startsWith("/debug");
  const isAuth =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/onboarding");

  if (isDebug || isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <main className="mx-auto min-h-full max-w-lg pb-nav">
        <InstallPrompt />
        <div className="pt-safe">{children}</div>
      </main>
      <BottomNav />
      <Toaster theme="dark" position="top-center" />
    </>
  );
}
