import { ArchiveCollectionScreen } from '@/components/archive/ArchiveCollectionScreen';
export default async function ArchiveCollectionPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  return <ArchiveCollectionScreen key={collectionId} collectionId={collectionId} />;
}
