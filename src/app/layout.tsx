import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageTransition } from "@/components/layout/page-transition";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SwReset } from "@/components/pwa/sw-reset";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { UserProvider } from "@/components/providers/user-provider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRoof",
  description: "Personal workout tracking",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PRoof",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} dark h-full`}>
      <body className="min-h-full bg-zinc-950 text-zinc-50 antialiased">
        <UserProvider>
          <main className="mx-auto min-h-full max-w-lg pb-nav">
            <PageTransition>{children}</PageTransition>
          </main>
          <BottomNav />
          <SwReset />
          <ServiceWorkerRegister />
          <InstallPrompt />
          <Toaster theme="dark" position="top-center" />
        </UserProvider>
      </body>
    </html>
  );
}
