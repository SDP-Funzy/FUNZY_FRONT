'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LetterboxHeader } from '@/components/letterbox/LetterboxHeader';
import { LetterLoadState } from '@/components/letterbox/LetterLoadState';
import { Popup } from '@/components/ui/Popup';
import { useServerLetter } from '@/hooks/letterbox/useServerLetter';
import { useLetterKok } from '@/hooks/letterbox/useLetterKok';
import type { Letter } from '@sdp/core';
import { letterImageUrl } from '@/lib/letterService';
import { ROUTES } from '@/lib/routes';

const Cards = ({ letter, replace }: { letter: Letter; replace: (letter: Letter) => void }) => {
  const router = useRouter();
  const [restoreId, setRestoreId] = useState<number | null>(null);
  const { pending, error, setError, run } = useLetterKok(letter, replace);
  return <div className="flex flex-1 flex-col bg-cream pb-[32px]">
    <LetterboxHeader sender expanded={false} onSearch={() => router.push(ROUTES.letterbox)} />
    <div className="flex items-center justify-between px-[24px] pt-[28px]"><h1 className="text-16 font-semibold">{letter.fromName}의 편지</h1><p className="text-12">카드 <span className="rounded-[4px] bg-orange px-[5px] py-[2px] text-white">{letter.cards.length}개</span></p></div>
    <div className="grid grid-cols-2 gap-x-[28px] gap-y-[28px] px-[24px] pt-[24px]">
      {letter.cards.map(card => <div key={card.cardId} className="relative min-w-0">
        {card.kok?.locked ? <button type="button" disabled={pending !== null} onClick={() => setRestoreId(card.cardId)} className="flex aspect-[1.1] w-full flex-col items-center justify-center rounded-[12px] bg-gray-m-100 text-14"><span>숨긴 편지</span><span className="mt-[4px] text-12">눌러서 숨김 해제</span></button>
          : <Link href={`${ROUTES.letterbox}/${letter.letterId}/${card.cardId}`} aria-label={`카드 ${card.cardOrder} 보기`} className="relative block aspect-[1.1] overflow-hidden rounded-[12px] bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-orange">
            {letterImageUrl(card.imageUrl) ? <Image src={letterImageUrl(card.imageUrl)!} alt="" fill unoptimized sizes="(min-width: 768px) 163px, 42vw" className="object-cover" /> : <span className="line-clamp-5 block px-[14px] py-[16px] text-12 leading-[1.6] break-words">{card.content}</span>}
          </Link>}
        {!card.kok?.locked && <button type="button" disabled={pending !== null} aria-label={`카드 ${card.cardOrder} 즐겨찾기`} aria-pressed={!!card.kok} onClick={() => void run(card.cardId, !card.kok)} className="absolute right-0 bottom-0 flex size-[44px] items-center justify-center rounded-full disabled:opacity-50"><Image src={card.kok ? '/icons/favorite-active.svg' : '/icons/favorite-inactive.svg'} alt="" width={24} height={24} /></button>}
      </div>)}
    </div>
    {!!letter.doodlePick?.giftItems.length && <div className="mt-auto flex justify-center px-page pt-[36px]"><Link href={`${ROUTES.letterbox}/${letter.letterId}/gifts`} className="flex min-h-[44px] items-center rounded-control bg-orange px-[22px] text-14 font-semibold text-white">선물카드 보러가기</Link></div>}
    <Popup isOpen={restoreId !== null} title="편지 숨김을 해제할까요?" description="전체 목록과 아카이브에 다시 표시됩니다." confirmLabel="숨김 해제" onCancel={() => setRestoreId(null)} onConfirm={() => { if (restoreId) void run(restoreId, true, false); setRestoreId(null); }} />
    <Popup isOpen={error !== null} title="변경하지 못했어요" description={error ?? undefined} showCancel={false} onCancel={() => setError(null)} onConfirm={() => setError(null)} />
  </div>;
};
export const ReceivedLetterCardsScreen = ({ id }: { id: string }) => {
  const resource = useServerLetter(id);
  return resource.data ? <Cards letter={resource.data} replace={resource.replace} /> : <LetterLoadState error={resource.error} onRetry={resource.reload} />;
};
