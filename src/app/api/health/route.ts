import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasDb = Boolean(process.env.DATABASE_URL);
  return NextResponse.json({
    ok: true,
    hasDb,
    buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? null,
    at: new Date().toISOString(),
  });
}
