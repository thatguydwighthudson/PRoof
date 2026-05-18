import { WorkoutSession } from "@/components/workout/workout-session";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkoutSession sessionId={parseInt(id, 10)} />;
}
