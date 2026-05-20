/** Calendar day (UTC YYYY-MM-DD) when the workout was completed. */
export function completionDateKey(endedAt: string | Date): string {
  const d = endedAt instanceof Date ? endedAt : new Date(endedAt);
  return d.toISOString().slice(0, 10);
}

export function parseLogDate(isoDateOrTimestamp: string): Date {
  const iso = isoDateOrTimestamp.includes("T")
    ? isoDateOrTimestamp
    : `${isoDateOrTimestamp}T12:00:00`;
  return new Date(iso);
}
