import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLetterDelivery, validateLetterDraft } from '../src/letter/LetterDelivery';
import { createReceivedLettersStore } from '../src/letter/ReceivedLettersStore';
import { createHttpLetterRepository } from '../src/letter/HttpLetterRepository';
import { createHttpClient } from '../src/shared/http/HttpClient';
import { ApiError } from '../src/shared/http/ApiError';
import { createTokenStore } from '../src/shared/storage/TokenStore';
import type { Letter, LetterDraftCard, LetterRepository, ReceivedLetter, ReceivedLetterPage } from '../src/letter/Letter';

const draft = (): LetterDraftCard => ({ id: 'local-1', to: '받는이', from: '보내는이', category: 'BOOK', customCategory: '', content: '함께 읽고 싶어요.' });
const member = { memberId: 1, nickname: '보내는이', profileImageUrl: null };
const setup = () => {
  let letter: Letter = { letterId: 7, status: 'DRAFT', toName: '받는이', fromName: '보내는이', designType: 'DesignType_A', sender: member, recipient: null, cards: [], doodlePick: null, selectedGiftItemId: null, createdAt: '', updatedAt: '', completedAt: null, sentAt: null, readAt: null };
  const calls = { create: 0, add: 0, complete: 0, share: 0, upload: 0, update: 0 };
  const faults = { create: false, add: false, share: false };
  let created = false;
  const copy = () => structuredClone(letter);
  const repo: LetterRepository = {
    drafts: async () => created ? [{ letterId: 7, status: letter.status, toName: letter.toName, fromName: letter.fromName, cardCount: letter.cards.length, updatedAt: '' }] : [],
    create: async () => { calls.create++; created = true; if (faults.create) { faults.create = false; throw new ApiError(0, 'NETWORK_ERROR', '응답 유실'); } return copy(); },
    get: async () => copy(),
    updateEnvelope: async (_id, input) => { letter = { ...letter, ...input }; return copy(); },
    addCard: async (_id, input) => { calls.add++; letter.cards.push({ cardId: calls.add, cardOrder: letter.cards.length, category: input.category, content: input.content, customCategory: input.customCategory ?? null, imageUrl: input.imageKey ? 'https://image.test/photo.png' : null, kok: null }); if (faults.add) { faults.add = false; throw new ApiError(503, 'ERROR', '응답 유실'); } return copy(); },
    updateCard: async (_id, id, input) => { calls.update++; letter.cards = letter.cards.map(card => card.cardId === id ? { ...card, ...input } : card); return copy(); },
    removeCard: async (_id, id) => { letter.cards = letter.cards.filter(card => card.cardId !== id); return copy(); },
    complete: async () => { calls.complete++; letter.status = 'COMPLETED'; return copy(); },
    share: async () => { calls.share++; letter.status = 'SENT'; if (faults.share) { faults.share = false; throw new ApiError(0, 'NETWORK_ERROR', '응답 유실'); } return { token: 'actual-token', expiresAt: '2099-01-01T00:00:00Z' }; },
    presign: async () => ({ uploadUrl: 'https://storage.test/upload', imageKey: 'photo-key', imageUrl: 'https://image.test/photo.png', method: 'PUT', expiresAt: '2099-01-01T00:00:00Z' }),
    received: async () => { throw new Error('unused'); }, shared: async () => { throw new Error('unused'); }, receive: async () => copy(), chooseGift: async () => copy(), setKok: async () => { throw new Error('unused'); },
  };
  const delivery = createLetterDelivery(repo, async () => { calls.upload++; });
  return { repo, calls, faults, delivery };
};

test('전송은 중복 클릭과 완료 후 재호출에도 편지·카드를 한 번만 생성한다', async () => {
  const { delivery, calls } = setup();
  const first = delivery.send([draft()]); const second = delivery.send([draft()]);
  assert.equal(first, second);
  assert.equal((await first).token, 'actual-token');
  await delivery.send([draft()]);
  assert.deepEqual(calls, { create: 1, add: 1, complete: 1, share: 1, upload: 0, update: 0 });
});

test('사진 카드 추가 응답을 잃어도 재시도는 업로드와 카드 추가를 중복하지 않는다', async () => {
  const { delivery, calls, faults } = setup(); faults.add = true;
  const card = { ...draft(), photo: { name: 'photo.png', type: 'image/png', size: 12, body: {} } };
  await assert.rejects(delivery.send([card]));
  await delivery.send([card]);
  assert.deepEqual(calls, { create: 1, add: 1, complete: 1, share: 1, upload: 1, update: 0 });
});

test('편지 생성 응답 유실 시 새로 생긴 빈 임시 편지를 찾아 재사용한다', async () => {
  const { delivery, calls, faults } = setup(); faults.create = true;
  await assert.rejects(delivery.send([draft()]));
  await delivery.send([draft()]);
  assert.equal(calls.create, 1); assert.equal(calls.add, 1);
});

test('생성 결과가 모호하면 편지를 추가 생성하지 않는다', async () => {
  const { repo, calls, faults } = setup(); faults.create = true;
  repo.drafts = async () => [];
  const delivery = createLetterDelivery(repo, async () => {});
  await assert.rejects(delivery.send([draft()]));
  await assert.rejects(delivery.send([draft()]), (error: unknown) => error instanceof ApiError && error.code === 'LETTER_CREATE_UNCERTAIN');
  assert.equal(calls.create, 1);
});

test('공유 응답 유실 후에는 이미 보낸 카드 수정·완료 없이 링크만 다시 받는다', async () => {
  const { delivery, calls, faults } = setup(); faults.share = true;
  await assert.rejects(delivery.send([draft()]));
  await delivery.send([draft()]);
  assert.equal(calls.create, 1); assert.equal(calls.add, 1); assert.equal(calls.complete, 1); assert.equal(calls.share, 2);
});

test('API 입력 제한을 생성 요청 전에 검증한다', async () => {
  const { delivery, calls } = setup();
  const invalid = [[], Array.from({ length: 6 }, draft), [{ ...draft(), content: 'a'.repeat(501) }], [{ ...draft(), to: 'a'.repeat(11) }], [{ ...draft(), category: 'ETC' as const }], [{ ...draft(), photo: { name: 'x.svg', type: 'image/svg+xml', size: 1, body: {} } }], [draft(), { ...draft(), from: '다른이' }]];
  for (const cards of invalid) await assert.rejects(delivery.send(cards));
  assert.equal(calls.create, 0);
  assert.doesNotThrow(() => validateLetterDraft(Array.from({ length: 5 }, draft)));
});

const received = (id: number): ReceivedLetter => ({ letterId: id, sender: member, senderName: member.nickname, receiverName: '받는이', receivedAt: '2026-11-02T00:00:00Z', heartCardCount: 1, thumbnailImageUrls: [], read: false, locked: false });
const page = (ids: number[], index = 0, last = true): ReceivedLetterPage => ({ letters: ids.map(received), page: index, last, totalElements: 3, totalPages: 2 });
test('필터를 바꾸면 이전 조회 응답을 버리고 페이지 중복을 제거한다', async () => {
  let resolveOld!: (value: ReceivedLetterPage) => void;
  const store = createReceivedLettersStore({ received: async query => query.senderName === 'old' ? new Promise(resolve => { resolveOld = resolve; }) : query.page === 1 ? page([2, 3], 1) : page([1, 2], 0, false) });
  const old = store.load({ senderName: 'old' });
  await store.load({ senderName: 'new' }); resolveOld(page([99])); await old;
  assert.deepEqual(store.getSnapshot().items.map(item => item.letterId), [1, 2]);
  await store.more(); assert.deepEqual(store.getSnapshot().items.map(item => item.letterId), [1, 2, 3]);
  store.markRead(2); assert.equal(store.getSnapshot().items[1]?.read, true);
});

test('추가 페이지 실패는 현재 목록을 유지하고 재시도할 수 있다', async () => {
  let fails = true;
  const store = createReceivedLettersStore({ received: async query => { if (!query.page) return page([1], 0, false); if (fails) throw new Error('offline'); return page([2], 1); } });
  await store.load({}); await store.more(); assert.equal(store.getSnapshot().items.length, 1); assert.ok(store.getSnapshot().error);
  fails = false; await store.more(); assert.equal(store.getSnapshot().items.length, 2); assert.equal(store.getSnapshot().error, null);
});

test('익명 공유 조회에는 인증을 붙이지 않고 수신·숨김은 인증 요청으로 보낸다', async t => {
  const requests: { url: string; auth: string | null; body?: string }[] = [];
  const { repo } = setup(); const letter = await repo.get(7);
  const values = new Map<string, string>();
  const tokenStore = createTokenStore({ getItem: async key => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); }, removeItem: async key => { values.delete(key); } });
  await tokenStore.setTokens({ accessToken: 'access', refreshToken: 'refresh' });
  const http = createHttpClient({ baseUrl: 'https://api.test', tokenStore });
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input); requests.push({ url, auth: new Headers(init?.headers).get('Authorization'), body: init?.body as string });
    const data = url.endsWith('/receive') ? letter : url.includes('/kok') ? { heartCardId: 1, kok: true, locked: true } : { letter, viewer: 'ANONYMOUS', receivable: false };
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  });
  const repository = createHttpLetterRepository(http);
  await repository.shared('a/b', false); await repository.shared('a/b', true); await repository.receive('a/b'); await repository.setKok(1, true, true);
  assert.equal(requests[0]?.auth, null); assert.ok(requests[0]?.url.endsWith('/a%2Fb'));
  for (const request of requests.slice(1)) assert.equal(request.auth, 'Bearer access');
  assert.deepEqual(JSON.parse(requests[3]!.body!), { kok: true, locked: true });
});
