import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { CURRENT_USER_ID } from "@/lib/config";
import type { PreferredUnit } from "@/lib/units";

export async function getCurrentUser() {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, CURRENT_USER_ID))
    .limit(1);
  if (!user) throw new Error("User not found");
  return user;
}

export async function getPreferredUnit(): Promise<PreferredUnit> {
  const user = await getCurrentUser();
  return (user.preferredUnit as PreferredUnit) ?? "lbs";
}

export async function updatePreferredUnit(unit: PreferredUnit) {
  await db
    .update(users)
    .set({ preferredUnit: unit })
    .where(eq(users.id, CURRENT_USER_ID));
}
