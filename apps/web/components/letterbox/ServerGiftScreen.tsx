'use client';
import type { Letter } from '@sdp/core';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { LetterLoadState } from '@/components/letterbox/LetterLoadState';
import { Button } from '@/components/ui/Button';
import { Popup } from '@/components/ui/Popup';
import { useCardCarousel } from '@/hooks/common/useCardCarousel';
import { useServerLetter } from '@/hooks/letterbox/useServerLetter';
import { cn } from '@/lib/cn';
import { letterFailure, letterRepository } from '@/lib/letterService';
import { ROUTES } from '@/lib/routes';

const Choices = ({ letter, replace }: { letter: Letter; replace: (letter: Letter) => void }) => {
  const gifts = letter.doodlePick?.giftItems ?? [];
  const initial = letter.selectedGiftItemId ? Math.max(0, gifts.findIndex(gift => gift.giftItemId === letter.selectedGiftItemId) + 1) : 0;
  const { active, track, handlers } = useCardCarousel(gifts.length + 1, initial);
  const [candidate, setCandidate] = useState(letter.selectedGiftItemId);
  const [pending, setPending] = useState(false); const busy = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const back = `${ROUTES.letterbox}/${letter.letterId}`;
  const current = gifts[active - 1];
  if (!gifts.length) return <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream"><h1 className="text-18">이 편지에는 선물 후보가 없어요.</h1><Link href={back} className="min-h-[44px] underline">보관함으로 돌아가기</Link></div>;
  return <div className="flex min-h-dvh flex-none flex-col bg-gray-pc-800 py-[32px] text-white md:min-h-full">
    <div className="shrink-0 px-[24px]"><Image src="/images/logo-funzy-orange.png" alt="Funzy" width={74} height={56} className="object-contain" /><h1 className="mt-[20px] text-24 font-bold">카드가 도착했어요</h1><div className="mt-[4px] flex items-start justify-between gap-[12px]"><p className="text-14">{letter.fromName}님이 주고 싶은 마음이 도착했어요!</p><Link href={back} aria-label="선물카드 닫기" className="flex size-[36px] shrink-0 items-center justify-center"><Image src="/icons/close.svg" alt="" width={20} height={20} className="invert mix-blend-screen" /></Link></div></div>
    <div ref={track} {...handlers} role="region" aria-label="받은 선물카드" tabIndex={0} className="mt-[26px] flex shrink-0 cursor-grab snap-x snap-mandatory gap-[16px] overflow-x-auto px-[32px] py-[4px] select-none [scroll-padding-inline:32px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <article aria-label="선물 안내" aria-hidden={active !== 0} inert={active !== 0} className="flex h-[clamp(300px,calc(100dvh_-_340px),520px)] min-w-0 basis-full shrink-0 snap-center flex-col justify-between rounded-[20px] bg-orange p-[24px]"><div><p className="text-12">두들픽을 pick해주세요</p><p className="mt-[12px] text-24 font-semibold leading-[1.4]">여기서부터는<br />선물카드예요.</p></div><p className="text-14 leading-[1.6]">후보 중 하나를 골라볼까요?</p></article>
      {gifts.map((gift, index) => <button key={gift.giftItemId} type="button" disabled={pending} aria-label={`선물 후보 ${index + 1}: ${gift.name}`} aria-pressed={candidate === gift.giftItemId} aria-hidden={active !== index + 1} inert={active !== index + 1} onClick={() => setCandidate(gift.giftItemId)} className={cn('relative flex h-[clamp(300px,calc(100dvh_-_340px),520px)] min-w-0 basis-full shrink-0 snap-center flex-col items-center justify-center gap-[20px] rounded-[20px] border-[3px] bg-white p-[24px] text-black', candidate === gift.giftItemId ? 'border-orange' : 'border-transparent')}><span aria-hidden="true" className={cn('absolute top-[18px] left-[18px] size-[28px] rounded-full', candidate === gift.giftItemId ? 'bg-orange' : 'bg-gray-m-100')} /><span className="text-24 font-bold break-words">{gift.name}</span>{letter.doodlePick?.reason && <span className="text-14 leading-[1.7]">{letter.doodlePick.reason}</span>}</button>)}
    </div>
    <div className="flex min-h-[88px] shrink-0 justify-center px-[32px] pt-[24px]">{current && <Button variant="accent" fullWidth={false} disabled={pending} className="px-[24px]" onClick={async () => {
      if (busy.current) return; busy.current = true; setPending(true);
      try { const updated = await letterRepository.chooseGift(letter.letterId, current.giftItemId); replace(updated); setCandidate(updated.selectedGiftItemId); }
      catch (cause) { setCandidate(letter.selectedGiftItemId); setError(letterFailure(cause)); }
      finally { busy.current = false; setPending(false); }
    }}>{pending ? '선택 중...' : '이 카드로 할래요!'}</Button>}</div>
    <Popup isOpen={error !== null} title="선물을 선택하지 못했어요" description={error ?? undefined} showCancel={false} onCancel={() => setError(null)} onConfirm={() => setError(null)} />
  </div>;
};
export const ServerGiftScreen = ({ id, result = false }: { id: string; result?: boolean }) => {
  const resource = useServerLetter(id);
  if (!resource.data) return <LetterLoadState error={resource.error} onRetry={resource.reload} />;
  const letter = resource.data;
  if (!result) return <Choices key={id} letter={letter} replace={resource.replace} />;
  const gift = letter.doodlePick?.giftItems.find(item => item.giftItemId === letter.selectedGiftItemId);
  return <div className="flex flex-1 flex-col items-center justify-center gap-[28px] bg-cream px-page py-[60px]"><h1 className="text-18 font-bold">{gift ? `${letter.toName}님이 고른 두들픽이에요` : '아직 선물을 고르지 않았어요.'}</h1>{gift && <div className="flex min-h-[280px] w-full max-w-[240px] items-center justify-center rounded-funzy bg-white p-[24px] shadow-md"><p className="text-24 font-semibold break-words">{gift.name}</p></div>}<Link href={`${ROUTES.letterbox}/${id}`} className="flex min-h-[44px] items-center rounded-control bg-orange px-[28px] text-14 text-white">확인했어요</Link></div>;
};
