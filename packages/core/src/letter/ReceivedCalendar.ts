import { ApiError } from '../shared/http/ApiError';
import type { HttpClient } from '../shared/http/HttpClient';
import type { ReceivedLetterPage } from './Letter';

export type ReceivedCalendarDay = { date: string; imageUrls: string[] };
export type ReceivedCalendar = { type: 'RECEIVED'; year: number; month: number; days: ReceivedCalendarDay[] };
type CardPage = { items: { cardId: number; letterId: number; imageUrl: string | null }[]; hasNext: boolean; nextCursor: string | null };
const invalid = () => new ApiError(502, 'CALENDAR_RESPONSE_INVALID', '달력 사진을 확인하지 못했어요. 다시 시도해 주세요.');
const validId = (id: number) => Number.isSafeInteger(id) && id > 0;
export const createHttpReceivedCalendarRepository = (http: Pick<HttpClient, 'get'>) => ({
  month: async (year: number, month: number, signal?: AbortSignal): Promise<ReceivedCalendar> => {
    if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) throw new ApiError(400, 'COMMON_002', '달력의 연도와 월을 확인해 주세요.');
    signal?.throwIfAborted();
    const calendar = await http.get<ReceivedCalendar>('/api/cards/calendar', { query: { type: 'RECEIVED', year, month }, signal });
    signal?.throwIfAborted();
    const prefix = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-`;
    const lastDay = new Date(0); lastDay.setUTCFullYear(year, month, 0);
    if (!calendar || calendar.type !== 'RECEIVED' || calendar.year !== year || calendar.month !== month || !Array.isArray(calendar.days) || calendar.days.some(day =>
      !day || typeof day.date !== 'string' || !day.date.startsWith(prefix) || !/^\d{4}-\d{2}-\d{2}$/.test(day.date) || Number(day.date.slice(-2)) < 1 || Number(day.date.slice(-2)) > lastDay.getUTCDate() || !Array.isArray(day.imageUrls) || day.imageUrls.some(url => typeof url !== 'string')
    ) || new Set(calendar.days.map(day => day.date)).size !== calendar.days.length) throw invalid();
    if (!calendar.days.some(day => day.imageUrls.length)) return calendar;

    // 달력 응답에는 잠금 정보가 없다. 잠긴 편지의 사진은 목록과 마찬가지로 숨긴다.
    const hidden = new Set<number>();
    for (let page = 0; ; page++) {
      signal?.throwIfAborted();
      const result = await http.get<ReceivedLetterPage>('/api/letters/received', { query: { locked: true, page, size: 100, sort: 'LATEST' }, signal });
      signal?.throwIfAborted();
      if (!result || !Array.isArray(result.letters) || result.page !== page || typeof result.last !== 'boolean' || (!result.last && !result.letters.length) || result.letters.some(item => !validId(item.letterId))) throw invalid();
      result.letters.forEach(item => hidden.add(item.letterId));
      if (result.last) break;
    }
    if (!hidden.size) return calendar;
    const filterDay = async (day: ReceivedCalendarDay): Promise<ReceivedCalendarDay> => {
      if (!day.imageUrls.length) return day;
      const visible = new Set<string>(); const concealed = new Set<string>(); const cursors = new Set<string>();
      let cursor: string | undefined;
      do {
        signal?.throwIfAborted();
        const result = await http.get<CardPage>('/api/cards', { query: { type: 'RECEIVED', date: day.date, size: 50, cursor }, signal });
        signal?.throwIfAborted();
        if (!result || !Array.isArray(result.items) || typeof result.hasNext !== 'boolean' || result.items.some(card => !validId(card.cardId) || !validId(card.letterId) || !(card.imageUrl === null || typeof card.imageUrl === 'string'))) throw invalid();
        result.items.forEach(card => { if (card.imageUrl) (hidden.has(card.letterId) ? concealed : visible).add(card.imageUrl); });
        if (!result.hasNext) break;
        if (!result.nextCursor || cursors.has(result.nextCursor) || !result.items.length) throw invalid();
        cursors.add(result.nextCursor); cursor = result.nextCursor;
      } while (true);
      return { ...day, imageUrls: day.imageUrls.filter(url => visible.has(url) && !concealed.has(url)) };
    };
    const days: ReceivedCalendarDay[] = [];
    for (let index = 0; index < calendar.days.length; index += 4) {
      signal?.throwIfAborted();
      days.push(...await Promise.all(calendar.days.slice(index, index + 4).map(filterDay)));
    }
    return { ...calendar, days };
  },
});
