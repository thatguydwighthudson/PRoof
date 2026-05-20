"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
} from "@/lib/auth";

export type AuthFormState = {
  errors?: Record<string, string>;
};

export async function signUp(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;
  const trainingLevel =
    (formData.get("training_level") as string) ?? "beginner";

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required";
  if (!email || !email.includes("@"))
    errors.email = "Valid email is required";
  if (!password || password.length < 8)
    errors.password = "Password must be at least 8 characters";
  if (!["beginner", "intermediate", "advanced"].includes(trainingLevel))
    errors.training_level = "Invalid training level";
  if (Object.keys(errors).length) return { errors };

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length)
    return { errors: { email: "An account with this email already exists" } };

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      trainingLevel,
    })
    .returning();

  await createSession(user.id);
  redirect("/onboarding");
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) return { errors: { email: "No account found with this email" } };

  if (!user.passwordHash)
    return {
      errors: {
        email: "This account has no password set. Sign up with a new email.",
      },
    };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { errors: { password: "Incorrect password" } };

  await createSession(user.id);
  redirect("/today");
}

export async function signOut() {
  await deleteSession();
  redirect("/signin");
}
