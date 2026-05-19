import { SessionDetailView } from "@/components/history/session-detail-view";

export default async function HistorySessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  return <SessionDetailView sessionId={sessionId} />;
}
