import { FriendArchiveHome } from '@/components/friends/FriendArchiveScreens';
export default async function FriendArchivePage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  return <FriendArchiveHome memberId={memberId} />;
}
