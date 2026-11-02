import { ServerArchiveDetailScreen } from '@/components/archive/ServerArchiveDetailScreen';
export default async function ArchiveEntryPage({ params }: { params: Promise<{ collectionId: string; entryId: string }> }) {
  const { entryId } = await params;
  return <ServerArchiveDetailScreen key={entryId} id={entryId} />;
}
