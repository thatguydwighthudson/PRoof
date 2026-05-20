import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StreakCardSkeleton() {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      <div className="col-span-1 rounded-2xl p-4 ring-1 ring-zinc-800">
        <Skeleton className="h-3 w-16" />
        <div className="mt-3 flex items-end gap-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-12" />
        </div>
        <Skeleton className="mt-3 h-3 w-20" />
      </div>
      <div className="rounded-2xl p-4 ring-1 ring-zinc-800">
        <Skeleton className="h-3 w-14" />
        <div className="mt-3 flex items-end gap-2">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-10 w-8" />
        </div>
        <Skeleton className="mt-3 h-3 w-16" />
      </div>
    </div>
  );
}

export function TodayProgramCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-zinc-800 pl-5 shadow-xl">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-3 h-3 w-28" />
      <div className="mt-4 flex items-start gap-2">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-3/4 max-w-[200px]" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="mt-4 h-4 w-24" />
      <div className="mt-4 space-y-2 border-t border-zinc-800/80 pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-3">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TodayWorkoutSkeleton() {
  return (
    <div className="space-y-4">
      <StreakCardSkeleton />
      <TodayProgramCardSkeleton />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </div>
  );
}
