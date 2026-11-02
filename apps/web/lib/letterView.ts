import type { HeartCardDraft, Letter, LetterCard } from '@sdp/core';
import { letterImageUrl } from '@/lib/letterService';

export const asHeartCardDraft = (letter: Letter, card: LetterCard): HeartCardDraft => ({
  id: `card-${card.cardId}`, category: card.category, customCategory: card.customCategory ?? '', to: letter.toName, from: letter.fromName, content: card.content,
});
export const asLetterView = (letter: Letter) => ({
  sender: letter.fromName, recipient: letter.toName,
  date: (letter.sentAt ?? letter.createdAt)?.slice(0, 10).replaceAll('-', '.'),
  cards: letter.cards.map(card => ({ card: asHeartCardDraft(letter, card), photo: letterImageUrl(card.imageUrl) })),
  gifts: (letter.doodlePick?.giftItems ?? []).map(gift => ({ id: `gift-${gift.giftItemId}`, giftItemId: gift.giftItemId, label: gift.name })),
  reason: letter.doodlePick?.reason,
  selectedGiftId: letter.selectedGiftItemId ? `gift-${letter.selectedGiftItemId}` : null,
});
