import { NextResponse } from "next/server";
import { getActiveProgramDays } from "@/lib/services/program";

export async function GET() {
  const data = await getActiveProgramDays();
  if (!data) {
    return NextResponse.json({ days: [] });
  }
  return NextResponse.json(data);
}
