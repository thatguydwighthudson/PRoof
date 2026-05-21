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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PRoof",
  },
};

export const viewport: Viewport = {
  themeColor: "#181A1F",
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
      <body className="min-h-full bg-charcoal text-white antialiased">
        <UserProvider>
          <AppChrome>{children}</AppChrome>
        </UserProvider>
      </body>
    </html>
  );
}
