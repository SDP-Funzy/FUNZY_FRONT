import type { HeartCardDraft } from '@sdp/core';
import { createPreviewLetters } from '@/lib/letterboxPreview';
import type { ReceivedGift } from '@/lib/receivedGifts';

export type SharedLetterPreview = { token: string; sender: string; recipient: string; date: string; cards: { card: HeartCardDraft; photo: string }[]; gifts: ReceivedGift[] };

export const getSharedLetterPreview = (token: string): SharedLetterPreview | null => {
  if (token !== 'demo') return null;
  const letter = createPreviewLetters()[0];
  return {
    token, sender: 'YESEUNG', recipient: '주찌', date: letter.date.replaceAll('-', '.'),
    cards: [{ card: { id: 'heart-1', category: 'PLACE', customCategory: '', to: '주찌', from: 'YESEUNG', content: letter.pages[0].content }, photo: '/images/letterbox/sample-beach.png' }],
    gifts: [{ id: 'gift-1', image: '/images/gifts/gift-01.svg', label: '우산 꽂힌 음료' }],
  };
};
