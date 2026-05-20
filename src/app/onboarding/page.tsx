import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { enrollDefaultProgram } from "@/lib/services/onboarding";
import { Button } from "@/components/ui/button";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  await enrollDefaultProgram(user.id);

  return (
    <main className="bg-mesh min-h-screen px-4 pt-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        PRoof
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
        Welcome, {user.name}.
      </h1>
      <p className="mt-3 text-zinc-400">
        You&apos;re on the PPL 6-Day program. Let&apos;s get your first workout
        set up.
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        Training level:{" "}
        <span className="capitalize text-zinc-300">{user.trainingLevel}</span>
      </p>
      <Button asChild className="mt-8 w-full">
        <Link href="/today">Continue to Today</Link>
      </Button>
    </main>
  );
}
