import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpReceivedCalendarRepository } from '../src/letter/ReceivedCalendar';
import type { ReceivedCalendar } from '../src/letter/ReceivedCalendar';
import { createHttpClient } from '../src/shared/http/HttpClient';
import { createTokenStore } from '../src/shared/storage/TokenStore';
const calendar = (days: ReceivedCalendar['days'] = []): ReceivedCalendar => ({ type: 'RECEIVED', year: 2026, month: 11, days });

test('연도와 월 범위를 요청 전에 검사한다', async () => {
  const repo = createHttpReceivedCalendarRepository({ get: async <T>() => { assert.fail('잘못된 입력을 전송하면 안 됨'); return undefined as T; } });
  for (const [year, month] of [[0, 1], [10000, 1], [2026, 0], [2026, 13], [2026.5, 1]]) await assert.rejects(repo.month(year!, month!));
});
test('사진 없는 카드 날짜를 유지하고 불필요한 숨김 조회는 생략한다', async () => {
  let calls = 0;
  const repo = createHttpReceivedCalendarRepository({ get: async <T>() => { calls++; return calendar([{ date: '2026-11-04', imageUrls: [] }]) as T; } });
  const data = await repo.month(2026, 11); assert.equal(data.days.length, 1); assert.deepEqual(data.days[0]?.imageUrls, []); assert.equal(calls, 1);
});
test('잘못된 월·날짜·중복 날짜·사진 응답을 빈 달력으로 처리하지 않는다', async () => {
  for (const data of [calendar([{ date: '2026-11-31', imageUrls: [] }]), calendar([{ date: '2026-10-01', imageUrls: [] }]), calendar([{ date: '2026-11-01', imageUrls: [] }, { date: '2026-11-01', imageUrls: [] }]), { ...calendar(), month: 10 }, { ...calendar(), days: [{ date: '2026-11-01', imageUrls: [null] }] }]) {
    await assert.rejects(createHttpReceivedCalendarRepository({ get: async <T>() => data as T }).month(2026, 11));
  }
});
test('모든 잠긴 편지·카드 페이지를 확인하고 숨긴 사진을 제외한다', async () => {
  const calls: string[] = [];
  const repo = createHttpReceivedCalendarRepository({ get: async <T>(path: string, options?: { query?: Record<string, unknown> }) => {
    calls.push(path);
    if (path === '/api/cards/calendar') return calendar([{ date: '2026-11-04', imageUrls: ['private.png', 'public.png', 'same.png'] }, { date: '2026-11-05', imageUrls: [] }]) as T;
    if (path === '/api/letters/received') return { letters: [{ letterId: options?.query?.page === 0 ? 7 : 8 }], page: options?.query?.page, last: options?.query?.page === 1 } as T;
    assert.equal(options?.query?.date, '2026-11-04');
    return (options?.query?.cursor ? { items: [{ cardId: 3, letterId: 7, imageUrl: 'same.png' }, { cardId: 4, letterId: 10, imageUrl: 'same.png' }, { cardId: 5, letterId: 10, imageUrl: 'public.png' }], hasNext: false } : { items: [{ cardId: 1, letterId: 8, imageUrl: 'private.png' }], hasNext: true, nextCursor: 'next' }) as T;
  } });
  const data = await repo.month(2026, 11); assert.deepEqual(data.days[0]?.imageUrls, ['public.png']); assert.equal(data.days.length, 2);
  assert.equal(calls.filter(path => path === '/api/letters/received').length, 2); assert.ok(!calls.some(path => /^\/api\/letters\/\d+$/.test(path)));
});
test('잠긴 편지가 없으면 날짜별 카드 추가 조회를 하지 않는다', async () => {
  const calls: string[] = [];
  const repo = createHttpReceivedCalendarRepository({ get: async <T>(path: string) => { calls.push(path); return (path === '/api/cards/calendar' ? calendar([{ date: '2026-11-04', imageUrls: ['photo.png'] }]) : { letters: [], page: 0, last: true }) as T; } });
  assert.deepEqual((await repo.month(2026, 11)).days[0]?.imageUrls, ['photo.png']); assert.deepEqual(calls, ['/api/cards/calendar', '/api/letters/received']);
});
test('숨김 상태 확인 실패와 반복 커서를 조용히 무시하지 않는다', async () => {
  const offline = createHttpReceivedCalendarRepository({ get: async <T>(path: string) => { if (path !== '/api/cards/calendar') throw new Error('offline'); return calendar([{ date: '2026-11-04', imageUrls: ['private.png'] }]) as T; } });
  await assert.rejects(offline.month(2026, 11));
  const repeated = createHttpReceivedCalendarRepository({ get: async <T>(path: string) => (path === '/api/cards/calendar' ? calendar([{ date: '2026-11-04', imageUrls: ['private.png'] }]) : path === '/api/letters/received' ? { letters: [{ letterId: 7 }], page: 0, last: true } : { items: [{ cardId: 1, letterId: 7, imageUrl: 'private.png' }], hasNext: true, nextCursor: 'same' }) as T });
  await assert.rejects(repeated.month(2026, 11));
});
test('월 이동·닫기로 취소하면 후속 사진 조회를 중단한다', async () => {
  const abort = new AbortController(); let calls = 0;
  const repo = createHttpReceivedCalendarRepository({ get: async <T>() => { calls++; abort.abort(); return calendar([{ date: '2026-11-04', imageUrls: ['photo.png'] }]) as T; } });
  await assert.rejects(repo.month(2026, 11, abort.signal)); assert.equal(calls, 1);
});
test('사진을 확인하는 날짜별 요청은 동시에 최대 4개로 제한한다', async () => {
  let current = 0; let max = 0;
  const days = Array.from({ length: 10 }, (_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, imageUrls: ['photo.png'] }));
  const repo = createHttpReceivedCalendarRepository({ get: async <T>(path: string) => {
    if (path === '/api/cards/calendar') return calendar(days) as T;
    if (path === '/api/letters/received') return { letters: [{ letterId: 7 }], page: 0, last: true } as T;
    current++; max = Math.max(max, current); await new Promise(resolve => setTimeout(resolve, 0)); current--;
    return { items: [{ cardId: 1, letterId: 8, imageUrl: 'photo.png' }], hasNext: false } as T;
  } });
  assert.equal((await repo.month(2026, 11)).days.length, 10); assert.equal(max, 4);
});
test('달력 API에 인증·조회함·연월을 전달한다', async t => {
  t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL, init?: RequestInit) => {
    const parsed = new URL(String(url)); assert.equal(parsed.pathname, '/api/cards/calendar'); assert.equal(parsed.searchParams.get('type'), 'RECEIVED'); assert.equal(parsed.searchParams.get('year'), '2026'); assert.equal(parsed.searchParams.get('month'), '11'); assert.equal(init?.method, 'GET'); assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer access');
    return new Response(JSON.stringify({ success: true, data: calendar() }), { status: 200 });
  });
  const http = createHttpClient({ baseUrl: 'https://api.test', tokenStore: createTokenStore({ getItem: async () => 'access', setItem: async () => {}, removeItem: async () => {} }) });
  assert.deepEqual(await createHttpReceivedCalendarRepository(http).month(2026, 11), calendar());
});
