import { GiftArtwork } from '@/components/write/GiftArtwork';
import type { GiftCardDraft } from '@/lib/giftDraft';

export const GiftCardPreview = ({ card, photoUrl, date, index }: { card: GiftCardDraft; photoUrl?: string; date: string; index: number }) => (
  <article aria-label={`${index + 1}번째 선물카드 미리보기`} className="flex min-h-[400px] flex-col justify-between rounded-funzy bg-white px-[20px] py-[22px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
    <p className="text-12 text-gray-m-400">선물카드 {index + 1}</p>
    <GiftArtwork card={card} photoUrl={photoUrl} />
    <p className="text-center font-en text-12">{date}</p>
  </article>
);
