"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import {
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export type AccountFormState = {
  errors?: Record<string, string>;
  success?: string;
};

export async function updateProfile(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: "Not signed in" } };

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.toLowerCase().trim();

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required";
  if (!email || !email.includes("@"))
    errors.email = "Valid email is required";
  if (Object.keys(errors).length) return { errors };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, user.id)))
    .limit(1);
  if (existing) return { errors: { email: "That email is already in use" } };

  await db
    .update(users)
    .set({ name, email })
    .where(eq(users.id, user.id));

  return { success: "Profile updated" };
}

export async function changePassword(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: "Not signed in" } };

  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  const errors: Record<string, string> = {};
  if (!currentPassword) errors.current_password = "Current password is required";
  if (!newPassword || newPassword.length < 8)
    errors.new_password = "New password must be at least 8 characters";
  if (newPassword !== confirmPassword)
    errors.confirm_password = "Passwords do not match";
  if (Object.keys(errors).length) return { errors };

  if (!user.passwordHash) {
    return {
      errors: {
        current_password:
          "No password on file. Contact support or create a new account.",
      },
    };
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { errors: { current_password: "Current password is incorrect" } };

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, user.id));

  return { success: "Password updated" };
}
