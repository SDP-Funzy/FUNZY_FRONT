import { FriendArchiveCollection } from '@/components/friends/FriendArchiveScreens';
export default async function FriendCollectionPage({ params }: { params: Promise<{ memberId: string; collectionId: string }> }) {
  const { memberId, collectionId } = await params;
  return <FriendArchiveCollection key={collectionId} memberId={memberId} collectionId={collectionId} />;
}
