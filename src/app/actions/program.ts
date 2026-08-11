"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { resetProgramToWeek1 } from "@/lib/services/program";

export type ProgramFormState = {
  errors?: Record<string, string>;
  success?: string;
};

export async function restartAtWeek1(
  _prev: ProgramFormState,
  formData: FormData
): Promise<ProgramFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: "Not signed in" } };

  const rawDay = formData.get("day_number");
  const dayNumber = Number(rawDay);
  if (!Number.isInteger(dayNumber) || dayNumber < 1) {
    return { errors: { day_number: "Pick a valid day" } };
  }

  const result = await resetProgramToWeek1(dayNumber);
  if (!result) {
    return { errors: { form: "No active program to reset" } };
  }
  if ("error" in result) {
    return { errors: { day_number: "That day isn’t in your program" } };
  }

  revalidatePath("/today");
  revalidatePath("/settings");
  return {
    success: `You're back on Week 1 · Day ${result.nextDayNumber}`,
  };
}
