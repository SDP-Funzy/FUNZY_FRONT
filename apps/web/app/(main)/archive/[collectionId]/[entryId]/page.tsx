import { ArchiveDetailScreen } from '@/components/archive/ArchiveDetailScreen';
export default async function ArchiveEntryPage({ params }: { params: Promise<{ collectionId: string; entryId: string }> }) {
  const { collectionId, entryId } = await params;
  return <ArchiveDetailScreen key={entryId} collectionId={collectionId} entryId={entryId} />;
}
