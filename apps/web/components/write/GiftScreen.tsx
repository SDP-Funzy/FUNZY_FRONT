'use client';

import { isHeartCardWritten } from '@sdp/core';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { PageDots } from '@/components/ui/PageDots';
import { Popup } from '@/components/ui/Popup';
import { GiftArtwork } from '@/components/write/GiftArtwork';
import { GiftCardStrip } from '@/components/write/GiftCardStrip';
import { useGiftDraft } from '@/hooks/write/useGiftDraft';
import { useWriteDraft } from '@/hooks/write/useWriteDraft';
import { cn } from '@/lib/cn';
import { formatDotDate } from '@/lib/date';
import { isGiftCardWritten, MIN_GIFT_CARDS } from '@/lib/giftDraft';
import type { GiftTool } from '@/lib/giftDraft';
import { ROUTES } from '@/lib/routes';

const TOOL_CLASS = 'flex size-[32px] items-center justify-center rounded-chip focus-visible:outline-2 focus-visible:outline-orange disabled:opacity-30';
export const GiftScreen = () => {
  const gift = useGiftDraft();
  const heart = useWriteDraft();
  const router = useRouter();
  const [tool, setTool] = useState<GiftTool>('pen');
  const [notice, setNotice] = useState<'emptyGift' | 'emptyHeart' | null>(null);

  const preview = () => {
    const empty = gift.cards.findIndex(card => !isGiftCardWritten(card, Boolean(gift.photos[card.id])));
    if (empty !== -1) { gift.select(empty); setNotice('emptyGift'); return; }
    const emptyHeart = heart.cards.findIndex(card => !isHeartCardWritten(card));
    if (emptyHeart !== -1) { heart.goTo(emptyHeart); setNotice('emptyHeart'); return; }
    router.push(ROUTES.writePreview);
  };

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <h1 className="sr-only">선물카드 쓰기</h1>
      <Header className="bg-cream" paddingClassName="px-[17px]" left={<Image src="/images/logo-funzy-small.svg" alt="Funzy" width={83} height={56} priority />} />
      <GiftCardStrip />
      <div className="mt-[31px] px-[20px]">
        <article aria-label={`선물카드 ${gift.index + 1} / ${gift.cards.length}`}
          className="mx-auto flex w-full max-w-[362px] flex-col rounded-funzy bg-white px-[20px] py-[18px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-[6px]">
            <button type="button" aria-label="선물 그림 되돌리기" disabled={!gift.currentCard.strokes.length} onClick={() => gift.undo(gift.currentCard.id)} className={TOOL_CLASS}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4v6h6M4 10a8 8 0 1 1 1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" aria-label="검정 펜" aria-pressed={tool === 'pen'} onClick={() => setTool('pen')} className={cn(TOOL_CLASS, tool === 'pen' && 'bg-gray-m-50')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 16-1 5 5-1L21 7l-4-4L4 16Zm10-10 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" aria-label="지우개" aria-pressed={tool === 'eraser'} onClick={() => setTool('eraser')} className={cn(TOOL_CLASS, tool === 'eraser' && 'bg-gray-m-50')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 14 10-11 7 7-10 11H8l-4-4v-3Zm4-5 8 7M10 21h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <span className="ml-auto text-12 text-gray-m-400">{gift.index + 1}/{gift.cards.length}</span>
            {gift.cards.length > MIN_GIFT_CARDS && <button type="button" aria-label="현재 선물카드 삭제" onClick={() => gift.remove(gift.currentCard.id)} className={TOOL_CLASS}>×</button>}
          </div>
          <div className="mt-[10px]">
            <GiftArtwork key={gift.currentCard.id} card={gift.currentCard} photoUrl={gift.photos[gift.currentCard.id]?.url}
              tool={tool} onStroke={(stroke) => gift.appendStroke(gift.currentCard.id, stroke)} label={`${gift.index + 1}번째 선물 그림 그리기 영역`} />
          </div>
          <div className="mt-[12px] flex items-center justify-between">
            <button type="button" aria-label="이전 선물카드" disabled={gift.index === 0} onClick={() => gift.select(gift.index - 1)} className={TOOL_CLASS}><Image src="/icons/chevron-left.svg" alt="" width={14} height={21} /></button>
            <span className="font-en text-12">{formatDotDate(new Date())}</span>
            <button type="button" aria-label="다음 선물카드" disabled={gift.index === gift.cards.length - 1} onClick={() => gift.select(gift.index + 1)} className={TOOL_CLASS}><Image src="/icons/chevron-left.svg" alt="" width={14} height={21} className="-scale-x-100" /></button>
          </div>
        </article>
        {gift.photos[gift.currentCard.id] && <button type="button" onClick={() => gift.removePhoto(gift.currentCard.id)} className="mt-[8px] text-12 text-gray-m-500 underline">현재 선물 사진 삭제</button>}
      </div>
      <div className="mt-[26px] flex justify-center"><PageDots count={gift.cards.length} activeIndex={gift.index} onSelect={gift.select} getLabel={(index) => `${index + 1}번째 선물카드로 이동`} /></div>
      <div className="mt-[24px] flex gap-[14px] px-[24px] pb-[calc(35px+env(safe-area-inset-bottom,0px))]">
        <Button onClick={preview} className="flex-1">전송하기</Button>
        <Button variant="accent" onClick={() => router.push(ROUTES.write)} className="flex-1">마음카드 쓰기</Button>
      </div>
      <Popup isOpen={notice !== null} title={notice === 'emptyGift' ? '아직 비어 있는 선물카드가 있어요' : '아직 비어 있는 마음카드가 있어요'}
        description={notice === 'emptyGift' ? '선물카드마다 그림을 그리거나 사진을 선택해 주세요.' : '마음카드 내용을 채운 뒤 미리볼 수 있어요.'}
        showCancel={false} confirmLabel={notice === 'emptyGift' ? '확인' : '마음카드 쓰기'} onCancel={() => setNotice(null)}
        onConfirm={() => { if (notice === 'emptyHeart') router.push(ROUTES.write); setNotice(null); }} />
    </div>
  );
};
