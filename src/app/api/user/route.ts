import { NextResponse } from "next/server";
import { getCurrentUser, updatePreferredUnit } from "@/lib/services/user";
import type { PreferredUnit } from "@/lib/units";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    id: user.id,
    name: user.name,
    preferredUnit: user.preferredUnit,
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (body.preferredUnit === "lbs" || body.preferredUnit === "kg") {
    await updatePreferredUnit(body.preferredUnit as PreferredUnit);
  }
  const user = await getCurrentUser();
  return NextResponse.json({ preferredUnit: user.preferredUnit });
}
