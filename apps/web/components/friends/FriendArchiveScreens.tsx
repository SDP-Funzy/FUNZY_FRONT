'use client';

import { ArchiveCollectionScreen } from '@/components/archive/ArchiveCollectionScreen';
import { ArchiveDetailScreen } from '@/components/archive/ArchiveDetailScreen';
import { ArchiveScreen } from '@/components/archive/ArchiveScreen';
import { useFriendsPreview } from '@/components/friends/FriendsPreviewProvider';
import { ROUTES } from '@/lib/routes';

export const FriendArchiveHome = ({ memberId }: { memberId: string }) => {
  const { members } = useFriendsPreview();
  const member = members.find(item => item.id === memberId);
  if (!member || member.relation !== 'friend') return null;
  return <ArchiveScreen readOnly title={`${member.name}의 아카이브`} avatarSrc={member.avatar} baseHref={`${ROUTES.friends}/${memberId}`} profileHref={ROUTES.friends} />;
};
export const FriendArchiveCollection = ({ memberId, collectionId }: { memberId: string; collectionId: string }) =>
  <ArchiveCollectionScreen readOnly collectionId={collectionId} baseHref={`${ROUTES.friends}/${memberId}`} />;

export const FriendArchiveDetail = ({ memberId, collectionId, entryId }: { memberId: string; collectionId: string; entryId: string }) =>
  <ArchiveDetailScreen readOnly collectionId={collectionId} entryId={entryId} baseHref={`${ROUTES.friends}/${memberId}`} />;
