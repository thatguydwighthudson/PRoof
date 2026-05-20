import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { updatePreferredUnit } from "@/lib/services/user";
import type { PreferredUnit } from "@/lib/units";

export async function GET() {
  const { user, response } = await requireApiAuth();
  if (response) return response;
  return NextResponse.json({
    id: user!.id,
    name: user!.name,
    email: user!.email,
    preferredUnit: user!.preferredUnit,
    trainingLevel: user!.trainingLevel,
  });
}

export async function PATCH(req: Request) {
  const { user, response } = await requireApiAuth();
  if (response) return response;
  const body = await req.json();
  if (body.preferredUnit === "lbs" || body.preferredUnit === "kg") {
    await updatePreferredUnit(body.preferredUnit as PreferredUnit);
  }
  return NextResponse.json({ preferredUnit: user!.preferredUnit });
}
