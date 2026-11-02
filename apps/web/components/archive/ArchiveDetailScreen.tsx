'use client';

import Link from 'next/link';
import { useArchivePreview } from '@/components/archive/ArchivePreviewProvider';
import { LetterDetailScreen } from '@/components/letterbox/LetterDetailScreen';
import { ROUTES } from '@/lib/routes';

export const ArchiveDetailScreen = ({ collectionId, entryId }: { collectionId: string; entryId: string }) => {
  const { entries, letters } = useArchivePreview();
  const entry = entries.find(item => item.id === entryId && item.collectionId === collectionId);
  const letter = letters.find(item => item.id === entry?.letterId);
  const back = `${ROUTES.archive}/${collectionId}`;
  if (!entry || !letter) return <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream px-page py-[80px] text-center"><h1 className="text-18 font-bold">아카이브 카드를 찾을 수 없어요.</h1><Link href={back} className="flex min-h-[44px] items-center text-14 underline">묶음으로 돌아가기</Link></div>;
  return <LetterDetailScreen key={entryId} senderId={letter.senderId} letterId={letter.id} backHref={back} allowHide={false} />;
};
