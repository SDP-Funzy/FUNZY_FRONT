'use client';
import type { Letter } from '@sdp/core';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { LetterLoadState } from '@/components/letterbox/LetterLoadState';
import { Popup } from '@/components/ui/Popup';
import { useCardCarousel } from '@/hooks/common/useCardCarousel';
import { useServerLetter } from '@/hooks/letterbox/useServerLetter';
import { useLetterKok } from '@/hooks/letterbox/useLetterKok';
import { letterImageUrl } from '@/lib/letterService';
import { ROUTES } from '@/lib/routes';

const Reader = ({ letter, cardId, replace }: { letter: Letter; cardId: string; replace: (letter: Letter) => void }) => {
  const initial = letter.cards.findIndex(card => String(card.cardId) === cardId);
  const { active, track, handlers } = useCardCarousel(letter.cards.length, Math.max(0, initial), 36);
  const [hideId, setHideId] = useState<number | null>(null);
  const { pending, error, setError, run } = useLetterKok(letter, replace);
  const current = letter.cards[active];
  const image = current?.kok?.locked ? undefined : letterImageUrl(current?.imageUrl);
  const back = `${ROUTES.letterbox}/${letter.letterId}`;
  if (initial < 0) return <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream"><p>카드를 찾을 수 없어요.</p><Link href={back} className="underline">카드 목록으로 돌아가기</Link></div>;
  return <div className="relative isolate flex min-h-dvh flex-none flex-col justify-center overflow-hidden bg-cream py-[64px] md:min-h-full">
    {image && <Image src={image} alt="" fill unoptimized sizes="(min-width: 768px) 402px, 100vw" className="-z-10 object-cover" />}
    <h1 className="sr-only">{letter.fromName}의 편지 상세</h1>
    <div className="mb-[10px] flex justify-end px-[24px]"><Link href={back} aria-label="카드 상세 닫기" className="flex size-[36px] items-center justify-center rounded-control bg-white"><Image src="/icons/close.svg" alt="" width={24} height={24} /></Link></div>
    <div ref={track} {...handlers} role="region" aria-label="마음카드" tabIndex={0} className="flex shrink-0 cursor-grab snap-x snap-mandatory gap-[12px] overflow-x-auto overscroll-x-contain px-[24px] py-[6px] select-none [scroll-padding-inline:24px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {letter.cards.map((card, index) => <article key={card.cardId} aria-label={`마음카드 ${card.cardOrder}`} aria-hidden={active !== index} inert={active !== index} className="flex h-[clamp(340px,calc(100dvh_-_200px),520px)] min-w-0 basis-full shrink-0 snap-center flex-col rounded-[22px] border border-white/60 bg-white/65 px-[20px] py-[24px] shadow-lg backdrop-blur-md">
        {card.kok?.locked ? <div className="flex flex-1 flex-col items-center justify-center gap-[20px]"><h2 className="text-18 font-bold">숨긴 편지예요.</h2><button type="button" disabled={pending !== null} onClick={() => void run(card.cardId, true, false)} className="min-h-[44px] rounded-control bg-black px-[24px] text-14 text-white">숨김 해제</button></div> : <>
          <div className="mb-[24px] flex items-center justify-between gap-[8px]"><p className="text-14 font-semibold">To: {letter.toName}</p><div className="flex"><button type="button" disabled={pending !== null} aria-label="편지 즐겨찾기" aria-pressed={!!card.kok} onClick={() => void run(card.cardId, !card.kok)} className="flex size-[36px] items-center justify-center"><Image src={card.kok ? '/icons/favorite-active.svg' : '/icons/favorite-inactive.svg'} alt="" width={24} height={24} /></button><button type="button" disabled={pending !== null} aria-label="편지 숨기기" onClick={() => setHideId(card.cardId)} className="flex size-[36px] items-center justify-center"><Image src="/icons/letter-unlock.svg" alt="" width={26} height={26} /></button></div></div>
          <div role="region" aria-label="마음카드 본문" tabIndex={0} className="min-h-0 flex-1 overflow-y-auto overscroll-contain text-14 leading-[1.8] break-words whitespace-pre-wrap select-text">{card.content}</div>
          {card.link && /^https?:\/\//i.test(card.link) && <a href={card.link} target="_blank" rel="noreferrer" className="mt-[8px] truncate text-12 underline">{card.linkTitle || card.link}</a>}
          <div className="mt-[20px] text-right text-14"><p className="font-semibold">From: {letter.fromName}</p><p className="mt-[6px] text-12">{(letter.sentAt ?? letter.createdAt)?.slice(0, 10).replaceAll('-', '.')}</p></div>
        </>}
      </article>)}
    </div>
    <Popup isOpen={hideId !== null} title="편지를 숨길까요?" description="잠긴편지 목록에서 다시 표시할 수 있어요." confirmLabel="숨기기" onCancel={() => setHideId(null)} onConfirm={() => { if (hideId) void run(hideId, true, true); setHideId(null); }} />
    <Popup isOpen={error !== null} title="변경하지 못했어요" description={error ?? undefined} showCancel={false} onCancel={() => setError(null)} onConfirm={() => setError(null)} />
  </div>;
};
export const ReceivedCardDetailScreen = ({ id, cardId }: { id: string; cardId: string }) => {
  const resource = useServerLetter(id);
  return resource.data ? <Reader key={`${id}:${cardId}`} letter={resource.data} cardId={cardId} replace={resource.replace} /> : <LetterLoadState error={resource.error} onRetry={resource.reload} />;
};
