import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFavoriteReceivedLettersStore } from '../src/letter/FavoriteReceivedLetters';
import type { ReceivedLetter } from '../src/letter/Letter';

const letter = (id: number): ReceivedLetter => ({ letterId: id, sender: { memberId: 2, nickname: 'friend', profileImageUrl: null }, senderName: '친구', receiverName: '나', receivedAt: '2026-11-04', heartCardCount: 2, thumbnailImageUrls: [], read: false, locked: false });
const page = (items: ReceivedLetter[], index = 0, last = true) => ({ letters: items, page: index, last, totalElements: items.length, totalPages: last ? 1 : 2 });

test('모든 페이지를 확인하고 비공개 콕도 포함하며 편지를 중복하지 않는다', async () => {
  const calls: string[] = [];
  const store = createFavoriteReceivedLettersStore({ received: async query => { assert.equal(query.senderName, '친구'); assert.equal(query.receivedFrom, '2026-11-04'); return query.page === 0 ? page([letter(1)], 0, false) : page([letter(2), letter(3)], 1); } }, { get: async <T>(path: string, options?: { query?: Record<string, unknown> }) => {
    calls.push(path);
    if (path === '/api/cards') return (options?.query?.cursor ? { items: [{ cardId: 22, letterId: 2 }, { cardId: 23, letterId: 2 }], hasNext: false } : { items: [{ cardId: 11, letterId: 1 }], hasNext: true, nextCursor: 'next' }) as T;
    return { kok: path !== '/api/heart-cards/11/kok', locked: true } as T;
  } });
  await store.load({ senderName: '친구', receivedFrom: '2026-11-04', receivedTo: '2026-11-04' });
  assert.deepEqual(store.getSnapshot().items.map(item => item.letterId), [2]);
  assert.equal(store.getSnapshot().total, 1); assert.equal(store.getSnapshot().items[0].read, false);
  assert.ok(calls.every(path => !path.startsWith('/api/letters/')));
});

test('전체 즐겨찾기 개수와 더보기를 맞추고 새로고침 시 해제를 반영한다', async () => {
  let enabled = true; let reads = 0;
  const letters = Array.from({ length: 25 }, (_, index) => letter(index + 1));
  const store = createFavoriteReceivedLettersStore({ received: async () => page(letters) }, { get: async <T>(path: string) => {
    if (path === '/api/cards') { reads++; return { items: letters.map(item => ({ cardId: item.letterId, letterId: item.letterId })), hasNext: false } as T; }
    return { kok: enabled } as T;
  } });
  await store.load({}); assert.equal(store.getSnapshot().items.length, 20); assert.equal(store.getSnapshot().total, 25); assert.equal(store.getSnapshot().last, false);
  await store.more(); assert.equal(store.getSnapshot().items.length, 25); assert.equal(store.getSnapshot().last, true); assert.equal(reads, 1);
  enabled = false; await store.load({}); assert.equal(store.getSnapshot().total, 0); assert.equal(store.getSnapshot().last, true);
});

test('카드 상태 조회 실패를 빈 목록으로 숨기지 않고 재시도한다', async () => {
  let fail = true;
  const store = createFavoriteReceivedLettersStore({ received: async () => page([letter(1)]) }, { get: async <T>(path: string) => {
    if (path === '/api/cards') return { items: [{ cardId: 1, letterId: 1 }], hasNext: false } as T;
    if (fail) throw new Error('offline');
    return { kok: true } as T;
  } });
  await store.load({}); assert.ok(store.getSnapshot().error); assert.equal(store.getSnapshot().loaded, false);
  fail = false; await store.reload(); assert.equal(store.getSnapshot().error, null); assert.equal(store.getSnapshot().total, 1);
});

test('탭 이동으로 취소된 응답은 목록에 반영하지 않는다', async () => {
  let finish!: (value: ReturnType<typeof page>) => void;
  const store = createFavoriteReceivedLettersStore({ received: () => new Promise(resolve => { finish = resolve; }) }, { get: async <T>() => { throw new Error('조회하면 안 됨'); return undefined as T; } });
  const pending = store.load({}); store.cancel(); finish(page([letter(1)])); await pending;
  assert.deepEqual(store.getSnapshot().items, []); assert.equal(store.getSnapshot().loaded, false);
});

test('빈 받은함은 카드 조회를 생략하고 잘못된 커서는 실패한다', async () => {
  let empty = true; let calls = 0;
  const store = createFavoriteReceivedLettersStore({ received: async () => page(empty ? [] : [letter(1)]) }, { get: async <T>(path: string) => { calls++; return (path === '/api/cards' ? { items: [{ cardId: 1, letterId: 1 }], hasNext: true, nextCursor: 'repeat' } : { kok: false }) as T; } });
  await store.load({}); assert.equal(calls, 0); assert.equal(store.getSnapshot().total, 0);
  empty = false; await store.reload(); assert.ok(store.getSnapshot().error);
});
