import { WorkoutSession } from "@/components/workout/workout-session";

export default async function WorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { id } = await params;
  const { preview } = await searchParams;
  return (
    <WorkoutSession
      sessionId={parseInt(id, 10)}
      previewFromUrl={preview === "1"}
    />
  );
}
