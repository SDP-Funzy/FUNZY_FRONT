import type { HeartCardCategory } from '../heartCard/domain/HeartCard';

export type LetterMember = { memberId: number; nickname: string; profileImageUrl: string | null };
export type LetterKok = { archiveCardId: number; category: HeartCardCategory; locked: boolean };
export type LetterCard = { cardId: number; cardOrder: number; category: HeartCardCategory; customCategory: string | null; content: string; imageUrl: string | null; link?: string | null; linkTitle?: string | null; kok: LetterKok | null };
export type LetterGift = { giftItemId: number; itemOrder: number; name: string };
export type LetterEnvelope = { toName: string; fromName: string; designType: 'DesignType_A' | 'DesignType_B' | 'DesignType_C' };
export type Letter = LetterEnvelope & { letterId: number; status: 'DRAFT' | 'COMPLETED' | 'SENT'; sender: LetterMember; recipient: LetterMember | null; cards: LetterCard[]; doodlePick: { reason: string | null; giftItems: LetterGift[] } | null; selectedGiftItemId: number | null; createdAt: string; updatedAt: string; completedAt: string | null; sentAt: string | null; readAt: string | null };
export type SharedLetter = { letter: Letter; viewer: 'ANONYMOUS' | 'SENDER' | 'RECIPIENT' | 'OTHER'; receivable: boolean };
export type LetterCardInput = { category: HeartCardCategory; content: string; customCategory?: string; imageKey?: string };
export type LetterShareLink = { token: string; expiresAt: string };
export type LetterImageUpload = { uploadUrl: string; imageKey: string; imageUrl: string; method: string; expiresAt: string };
export type LetterPhoto = { name: string; type: string; size: number; body: unknown };
export type LetterDraftCard = { id: string; to: string; from: string; category: HeartCardCategory; customCategory: string; content: string; photo?: LetterPhoto };
export type SentLetterReceipt = LetterShareLink & { letterId: number };
export type ServerLetterDraft = { letterId: number; status: Letter['status']; toName: string; fromName: string; cardCount: number; updatedAt: string };
export type ReceivedLetter = { letterId: number; sender: LetterMember; senderName: string; receiverName: string; receivedAt: string; heartCardCount: number; thumbnailImageUrls: string[]; read: boolean; locked: boolean };
export type ReceivedLetterPage = { letters: ReceivedLetter[]; page: number; last: boolean; totalElements: number; totalPages: number };
export type ReceivedLetterQuery = { senderName?: string; receivedFrom?: string; receivedTo?: string; locked?: boolean; page?: number; size?: number };
export type KokResult = { heartCardId: number; kok: boolean; archiveCardId: number | null; category: HeartCardCategory | null; locked: boolean | null };

export type LetterRepository = {
  create: (envelope: LetterEnvelope) => Promise<Letter>;
  drafts: () => Promise<ServerLetterDraft[]>;
  get: (id: number) => Promise<Letter>;
  updateEnvelope: (id: number, envelope: LetterEnvelope) => Promise<Letter>;
  addCard: (id: number, card: LetterCardInput) => Promise<Letter>;
  updateCard: (id: number, cardId: number, card: LetterCardInput) => Promise<Letter>;
  removeCard: (id: number, cardId: number) => Promise<Letter>;
  complete: (id: number) => Promise<Letter>;
  share: (id: number) => Promise<LetterShareLink>;
  presign: (photo: LetterPhoto) => Promise<LetterImageUpload>;
  received: (query: ReceivedLetterQuery) => Promise<ReceivedLetterPage>;
  shared: (token: string, authenticated: boolean) => Promise<SharedLetter>;
  receive: (token: string) => Promise<Letter>;
  chooseGift: (id: number, giftId: number | null) => Promise<Letter>;
  setKok: (cardId: number, kok: boolean, locked?: boolean) => Promise<KokResult>;
};
