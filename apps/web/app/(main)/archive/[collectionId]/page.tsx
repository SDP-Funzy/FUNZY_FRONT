import { ServerArchiveCollectionScreen } from '@/components/archive/ServerArchiveCollectionScreen';
export default async function ArchiveCollectionPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  return <ServerArchiveCollectionScreen key={collectionId} category={collectionId} />;
}
