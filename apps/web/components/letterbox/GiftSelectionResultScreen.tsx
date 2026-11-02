'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLetterboxPreview } from '@/components/letterbox/LetterboxPreviewProvider';
import { Header } from '@/components/ui/Header';
import { ROUTES } from '@/lib/routes';

export const GiftSelectionResultScreen = ({ senderId }: { senderId: string }) => {
  const { giftPacks } = useLetterboxPreview();
  const pack = giftPacks.find(item => item.senderId === senderId);
  const gift = pack?.gifts.find(item => item.id === pack.selectedGiftId);
  const back = `${ROUTES.letterbox}/${senderId}`;
  return <div className="flex flex-1 flex-col bg-cream pb-[40px]">
    <Header title="편지가 왔어요" className="bg-cream" left={<Link href={back} aria-label="보관함으로 돌아가기" className="flex size-[44px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange"><Image src="/icons/chevron-left.svg" alt="" width={14} height={21} /></Link>} />
    <div className="px-page pt-[24px]"><h1 className="text-18 font-bold">{gift && pack ? `${pack.recipient}님이 고른 두들픽이에요` : pack ? '아직 선물을 고르지 않았어요.' : '선물카드를 찾을 수 없어요.'}</h1>
      {gift && pack && <p className="mt-[8px] text-14">{pack.recipient}님이 고른 선물카드예요.</p>}
    </div>
    <div className="flex flex-1 items-center justify-center px-[48px] py-[48px]">{gift && <div className="relative aspect-[210/310] w-full max-w-[240px] overflow-hidden rounded-[24px] bg-white shadow-md"><Image src={gift.image} alt={gift.label} fill sizes="240px" className="object-contain p-[16px]" /></div>}</div>
    <Link href={back} className="mx-auto flex min-h-[44px] items-center justify-center rounded-control bg-orange px-[32px] text-14 font-semibold text-white">확인했어요</Link>
  </div>;
};
