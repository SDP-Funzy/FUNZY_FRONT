import { ApiError } from '../shared/http/ApiError';
import type { HttpClient } from '../shared/http/HttpClient';
import type { KokResult, LetterRepository, ReceivedLetter, ReceivedLetterQuery } from './Letter';
import { createReceivedLettersStore } from './ReceivedLettersStore';

type CardPage = { items: { cardId: number; letterId: number }[]; hasNext: boolean; nextCursor: string | null };
const invalid = () => new ApiError(502, 'LETTER_RESPONSE_INVALID', '즐겨찾기 목록을 확인하지 못했어요. 다시 시도해 주세요.');

/** 목록 조회만 사용한다. 편지 열기 API는 미읽음 편지를 읽음으로 바꾸므로 사용하지 않는다. */
export const createFavoriteReceivedLettersStore = (repo: Pick<LetterRepository, 'received'>, http: Pick<HttpClient, 'get'>) => {
  let generation = 0;
  let snapshot: ReceivedLetter[] = [];
  const collect = async (query: ReceivedLetterQuery) => {
    const request = ++generation;
    const check = () => { if (request !== generation) throw new Error('Cancelled'); };
    const letters = new Map<number, ReceivedLetter>();
    for (let page = 0; ; page++) {
      check();
      const result = await repo.received({ ...query, page, size: 100 });
      check();
      if (result.page !== page || (!result.last && !result.letters.length)) throw invalid();
      result.letters.forEach(letter => letters.set(letter.letterId, letter));
      if (result.last) break;
    }
    if (!letters.size) return [];
    const favorites = new Set<number>();
    const seenCards = new Set<number>();
    const cursors = new Set<string>();
    let cursor: string | undefined;
    do {
      check();
      const result = await http.get<CardPage>('/api/cards', { query: { type: 'RECEIVED', size: 50, cursor } });
      check();
      if (!result || !Array.isArray(result.items) || typeof result.hasNext !== 'boolean' || result.items.some(card => !Number.isSafeInteger(card.cardId) || card.cardId <= 0 || !Number.isSafeInteger(card.letterId) || card.letterId <= 0)) throw invalid();
      const candidates = result.items.filter(card => {
        if (!letters.has(card.letterId) || favorites.has(card.letterId) || seenCards.has(card.cardId)) return false;
        seenCards.add(card.cardId); return true;
      });
      // 대량 보관함에서도 카드별 요청이 한꺼번에 몰리지 않도록 제한한다.
      for (let index = 0; index < candidates.length; index += 6) {
        check();
        await Promise.all(candidates.slice(index, index + 6).filter(card => !favorites.has(card.letterId)).map(async card => {
          const kok = await http.get<KokResult>(`/api/heart-cards/${card.cardId}/kok`);
          check();
          if (!kok || typeof kok.kok !== 'boolean') throw invalid();
          if (kok.kok) favorites.add(card.letterId);
        }));
      }
      if (!result.hasNext || favorites.size === letters.size) break;
      if (!result.nextCursor || cursors.has(result.nextCursor) || !result.items.length) throw invalid();
      cursors.add(result.nextCursor); cursor = result.nextCursor;
    } while (true);
    check();
    return [...letters.values()].filter(letter => favorites.has(letter.letterId));
  };
  const store = createReceivedLettersStore({ received: async query => {
    const page = query.page ?? 0; const size = query.size ?? 20;
    if (page === 0) snapshot = await collect(query);
    return { letters: snapshot.slice(page * size, (page + 1) * size), page, last: (page + 1) * size >= snapshot.length, totalElements: snapshot.length, totalPages: Math.ceil(snapshot.length / size) };
  } });
  return { ...store, cancel: () => { generation++; store.cancel(); }, load: (query: ReceivedLetterQuery) => store.load(query, true) };
};
