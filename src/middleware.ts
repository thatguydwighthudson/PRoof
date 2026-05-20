import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/today",
  "/history",
  "/exercises",
  "/chat",
  "/body",
  "/settings",
  "/workout",
  "/onboarding",
];

/** Cache headers + session gate for app routes. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get("session_id")?.value;

  const isPublicApi =
    pathname === "/api/health" ||
    pathname.startsWith("/api/cron/");

  if (
    pathname.startsWith("/api/") &&
    !isPublicApi &&
    !sessionId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !sessionId) {
    const signIn = new URL("/signin", request.url);
    signIn.searchParams.set("from", pathname);
    return NextResponse.redirect(signIn);
  }

  const response = NextResponse.next();

  if (sessionId) {
    response.headers.set("x-session-id", sessionId);
  }

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
