'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCardCarousel } from '@/hooks/common/useCardCarousel';
import { useLetterboxPreview } from '@/components/letterbox/LetterboxPreviewProvider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';

export const ReceivedGiftScreen = ({ senderId }: { senderId: string }) => {
  const { giftPacks, chooseGift } = useLetterboxPreview();
  const pack = giftPacks.find(item => item.senderId === senderId);
  const initial = pack?.selectedGiftId ? Math.max(0, pack.gifts.findIndex(gift => gift.id === pack.selectedGiftId) + 1) : 0;
  const { active, track, handlers } = useCardCarousel((pack?.gifts.length ?? 0) + 1, initial);
  const [candidateId, setCandidateId] = useState(pack?.selectedGiftId ?? null);
  const [announcement, setAnnouncement] = useState('');
  const back = `${ROUTES.letterbox}/${senderId}`;
  if (!pack?.gifts.length) return <div className="flex flex-1 flex-col items-center justify-center gap-[20px] bg-cream px-page"><h1 className="text-18 font-semibold">선물카드를 찾을 수 없어요.</h1><Link href={back} className="flex min-h-[44px] items-center text-14 underline">보관함으로 돌아가기</Link></div>;
  const currentGift = pack.gifts[active - 1];
  return <div className="flex min-h-dvh flex-none flex-col bg-gray-pc-800 py-[32px] text-white md:min-h-full">
    <div className="shrink-0 px-[24px]"><Image src="/images/logo-funzy-orange.png" alt="Funzy" width={74} height={56} className="h-[56px] w-[74px] object-contain" />
      <h1 className="mt-[20px] text-24 font-bold">카드가 도착했어요</h1>
      <div className="mt-[4px] flex items-start justify-between gap-[12px]"><p className="text-14">{pack.sender}님이 주고 싶은 마음이 도착했어요!</p>
        <Link href={back} aria-label="선물카드 닫기" className="flex size-[36px] shrink-0 items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-orange"><Image src="/icons/close.svg" alt="" width={20} height={20} className="invert mix-blend-screen" /></Link>
      </div>
    </div>
    <p id="received-gift-help" className="sr-only">카드를 좌우로 넘기거나 방향키로 이동한 뒤 원하는 선물을 선택하세요.</p>
    <div ref={track} role="region" aria-label="받은 선물카드" aria-describedby="received-gift-help" tabIndex={0}
      {...handlers}
      className="mt-[26px] flex shrink-0 cursor-grab snap-x snap-mandatory gap-[16px] overflow-x-auto overscroll-x-contain px-[32px] py-[4px] select-none [scroll-padding-inline:32px] [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-orange active:cursor-grabbing [&::-webkit-scrollbar]:hidden">
      <article aria-label="선물 안내" aria-hidden={active !== 0} inert={active !== 0} className="flex h-[clamp(300px,calc(100dvh_-_340px),520px)] min-w-0 basis-full shrink-0 snap-center flex-col justify-between rounded-[20px] bg-orange p-[24px]">
        <div><p className="text-12">두들픽을 pick해주세요</p><p className="mt-[12px] text-24 font-semibold leading-[1.4]">여기서부터는<br />선물카드예요.</p></div>
        <p className="text-14 leading-[1.6]">{pack.sender}님이 주고 싶은 마음이 도착했어요!<br />후보 중 하나를 골라볼까요?</p>
      </article>
      {pack.gifts.map((gift, index) => <button key={gift.id} type="button" aria-label={`선물 후보 ${index + 1}: ${gift.label}`} aria-pressed={candidateId === gift.id} aria-hidden={active !== index + 1} inert={active !== index + 1}
        onClick={() => setCandidateId(gift.id)} className={cn('relative h-[clamp(300px,calc(100dvh_-_340px),520px)] min-w-0 basis-full shrink-0 snap-center overflow-hidden rounded-[20px] border-[3px] bg-white p-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange', candidateId === gift.id ? 'border-orange' : 'border-transparent')}>
        <span aria-hidden="true" className={cn('absolute top-[18px] left-[18px] z-10 size-[28px] rounded-full', candidateId === gift.id ? 'border-[5px] border-white bg-orange ring-1 ring-orange' : 'bg-gray-m-100')} />
        <Image src={gift.image} alt={gift.label} fill sizes="(min-width: 768px) 338px, 85vw" className="object-contain p-[20px]" />
      </button>)}
    </div>
    <div className="flex min-h-[88px] shrink-0 justify-center px-[32px] pt-[24px]">
      {currentGift && <Button variant="accent" fullWidth={false} onClick={() => { setCandidateId(currentGift.id); chooseGift(senderId, currentGift.id); setAnnouncement('선물을 선택했어요.'); }} className="px-[24px]">이 카드로 할래요!</Button>}
    </div>
    <p role="status" className="sr-only">{announcement}</p>
  </div>;
};
