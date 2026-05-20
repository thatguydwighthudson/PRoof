import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  getCurrentUser,
  requireCurrentUser,
} from "@/lib/auth";
import type { PreferredUnit } from "@/lib/units";

export { getCurrentUser, requireCurrentUser };

export async function requireUserId(): Promise<number> {
  const user = await requireCurrentUser();
  return user.id;
}

export async function getPreferredUnit(): Promise<PreferredUnit> {
  const user = await requireCurrentUser();
  return (user.preferredUnit as PreferredUnit) ?? "lbs";
}

export async function updatePreferredUnit(unit: PreferredUnit) {
  const user = await requireCurrentUser();
  await db
    .update(users)
    .set({ preferredUnit: unit })
    .where(eq(users.id, user.id));
}
