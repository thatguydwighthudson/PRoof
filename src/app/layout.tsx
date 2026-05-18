import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SwReset } from "@/components/pwa/sw-reset";
import { UserProvider } from "@/components/providers/user-provider";
import "./globals.css";

export const dynamic = "force-dynamic";

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
        {/* Unregister SW before React — fixes stuck iOS PWAs from earlier deploys */}
        <Script id="unregister-sw" strategy="beforeInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function (regs) {
                regs.forEach(function (r) { r.unregister(); });
              });
            }
          `}
        </Script>
        <UserProvider>
          <main className="mx-auto min-h-full max-w-lg pb-nav">{children}</main>
          <BottomNav />
          <SwReset />
          <InstallPrompt />
          <Toaster theme="dark" position="top-center" />
        </UserProvider>
      </body>
    </html>
  );
}
