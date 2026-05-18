import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppChrome } from "@/components/layout/app-chrome";
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
        <UserProvider>
          <AppChrome>{children}</AppChrome>
        </UserProvider>
      </body>
    </html>
  );
}
