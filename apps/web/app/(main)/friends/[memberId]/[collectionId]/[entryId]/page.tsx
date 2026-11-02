import { FriendArchiveDetail } from '@/components/friends/FriendArchiveScreens';
export default async function FriendEntryPage({ params }: { params: Promise<{ memberId: string; collectionId: string; entryId: string }> }) {
  const { memberId, collectionId, entryId } = await params;
  return <FriendArchiveDetail key={entryId} memberId={memberId} collectionId={collectionId} entryId={entryId} />;
}
