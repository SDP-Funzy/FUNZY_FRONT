import { ApiError } from '../shared/http/ApiError';
import type { HttpClient } from '../shared/http/HttpClient';
import type { Letter, LetterRepository, ReceivedLetterPage, SharedLetter, LetterShareLink, LetterImageUpload } from './Letter';

const invalid = () => new ApiError(502, 'LETTER_RESPONSE_INVALID', '서버의 편지 응답을 확인하지 못했어요. 다시 시도해 주세요.');
const idPath = (id: number) => {
  if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(400, 'COMMON_002', '편지 번호를 확인해 주세요.');
  return String(id);
};
const tokenPath = (token: string) => {
  if (!token || token.length > 512) throw new ApiError(400, 'LETTER_011', '공유 링크를 확인해 주세요.');
  return encodeURIComponent(token);
};
const letterResponse = (value: Letter): Letter => {
  if (!value || !Number.isSafeInteger(value.letterId) || value.letterId <= 0 || !Array.isArray(value.cards) || !['DRAFT', 'COMPLETED', 'SENT'].includes(value.status) || typeof value.toName !== 'string' || typeof value.fromName !== 'string') throw invalid();
  if (value.cards.some(card => !Number.isSafeInteger(card.cardId) || card.cardId <= 0 || typeof card.content !== 'string')) throw invalid();
  return { ...value, cards: [...value.cards].sort((a, b) => a.cardOrder - b.cardOrder) };
};

export const createHttpLetterRepository = (http: HttpClient): LetterRepository => ({
  create: async envelope => letterResponse(await http.post<Letter>('/api/letters', envelope)),
  drafts: () => http.get('/api/letters/drafts'),
  get: async id => letterResponse(await http.get<Letter>(`/api/letters/${idPath(id)}`)),
  updateEnvelope: async (id, envelope) => letterResponse(await http.put<Letter>(`/api/letters/${idPath(id)}`, envelope)),
  addCard: async (id, card) => letterResponse(await http.post<Letter>(`/api/letters/${idPath(id)}/cards`, card)),
  updateCard: async (id, cardId, card) => letterResponse(await http.put<Letter>(`/api/letters/${idPath(id)}/cards/${idPath(cardId)}`, card)),
  removeCard: async (id, cardId) => letterResponse(await http.delete<Letter>(`/api/letters/${idPath(id)}/cards/${idPath(cardId)}`)),
  complete: async id => letterResponse(await http.post<Letter>(`/api/letters/${idPath(id)}/complete`)),
  share: async id => {
    const value = await http.post<LetterShareLink>(`/api/letters/${idPath(id)}/share-link`);
    if (!value || typeof value.token !== 'string' || !value.token || !Number.isFinite(Date.parse(value.expiresAt))) throw invalid();
    return value;
  },
  presign: async photo => {
    const value = await http.post<LetterImageUpload>('/api/cards/images/presigned-url', { fileName: photo.name, contentType: photo.type });
    if (!value || !value.uploadUrl || !value.imageKey || !value.imageUrl || value.method !== 'PUT' || Date.parse(value.expiresAt) <= Date.now() || !Number.isFinite(Date.parse(value.expiresAt))) throw invalid();
    return value;
  },
  received: async query => {
    const value = await http.get<ReceivedLetterPage>('/api/letters/received', { query: { sort: 'LATEST', ...query } });
    if (!value || !Array.isArray(value.letters) || typeof value.last !== 'boolean' || value.letters.some(letter => !Number.isSafeInteger(letter.letterId) || letter.letterId <= 0)) throw invalid();
    return value;
  },
  shared: async (token, authenticated) => {
    const value = await http.get<SharedLetter>(`/api/letters/shared/${tokenPath(token)}`, { auth: authenticated });
    if (!value || !['ANONYMOUS', 'SENDER', 'RECIPIENT', 'OTHER'].includes(value.viewer) || typeof value.receivable !== 'boolean') throw invalid();
    return { ...value, letter: letterResponse(value.letter) };
  },
  receive: async token => letterResponse(await http.post<Letter>(`/api/letters/shared/${tokenPath(token)}/receive`)),
  chooseGift: async (id, giftId) => letterResponse(await http.put<Letter>(`/api/letters/${idPath(id)}/gift`, { giftItemId: giftId === null ? null : Number(idPath(giftId)) })),
  setKok: (cardId, kok, locked) => http.put(`/api/heart-cards/${idPath(cardId)}/kok`, { kok, ...(locked === undefined ? {} : { locked }) }),
});
