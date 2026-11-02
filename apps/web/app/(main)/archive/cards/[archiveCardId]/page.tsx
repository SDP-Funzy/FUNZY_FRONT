import { ServerArchiveDetailScreen } from '@/components/archive/ServerArchiveDetailScreen';
export default async function ArchiveCardPage({ params, searchParams }: { params: Promise<{ archiveCardId: string }>; searchParams: Promise<{ comments?: string }> }) {
  const { archiveCardId } = await params;
  const { comments } = await searchParams;
  return <ServerArchiveDetailScreen key={archiveCardId} id={archiveCardId} commentsInitiallyOpen={comments === '1'} />;
}
