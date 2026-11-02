'use client';
import Link from 'next/link';
import { useArchiveApi } from '@/components/archive/ArchiveApiProvider';
import { ServerArchiveScreen } from '@/components/archive/ServerArchiveScreen';
import { ServerArchiveCollectionScreen } from '@/components/archive/ServerArchiveCollectionScreen';
import { ServerArchiveDetailScreen } from '@/components/archive/ServerArchiveDetailScreen';
export const FriendArchiveHome = ({ memberId }: { memberId: string }) => <ServerArchiveScreen key={memberId} />;
export const FriendArchiveCollection = ({ collectionId }: { memberId: string; collectionId: string }) => <ServerArchiveCollectionScreen key={collectionId} category={collectionId} />;
export const FriendArchiveDetail = ({ collectionId, entryId }: { memberId: string; collectionId: string; entryId: string }) => {
  const archive = useArchiveApi();
  const exists = archive.data?.sections.some(section => section.category === collectionId && section.cards.some(card => String(card.archiveCardId) === entryId));
  if (!exists) return <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream"><p>카드를 찾을 수 없어요.</p><Link href={archive.baseHref} className="min-h-[44px] underline">친구 아카이브로 돌아가기</Link></div>;
  return <ServerArchiveDetailScreen key={entryId} id={entryId} />;
};
