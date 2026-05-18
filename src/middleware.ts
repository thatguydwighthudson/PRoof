import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Never cache HTML/app routes, API, or PWA metadata in prod. Hashed assets under /_next/static are excluded. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  if (pathname === "/sw.js" || pathname.startsWith("/sw.js")) {
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    return response;
  }

  if (pathname === "/manifest.json") {
    response.headers.set("Cache-Control", "no-cache, must-revalidate");
    return response;
  }

  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  // App Router pages (no static file extension)
  if (!pathname.startsWith("/_next/") && !/\.[a-z0-9]+$/i.test(pathname)) {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)",
  ],
};
