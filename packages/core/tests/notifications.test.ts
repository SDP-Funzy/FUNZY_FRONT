import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatNotificationTime, getNotificationLabel, getNotificationTarget } from '../src/notification/Notification';
import type { NotificationItem, NotificationRepository } from '../src/notification/Notification';
import { createHttpNotificationRepository } from '../src/notification/HttpNotificationRepository';
import { createNotificationStore } from '../src/notification/NotificationStore';
import { ApiError } from '../src/shared/http/ApiError';
import { createHttpClient } from '../src/shared/http/HttpClient';

const item = (id = 1, overrides: Partial<NotificationItem> = {}): NotificationItem => ({
  id, type: 'LETTER', content: '편지가 도착했어요.', read: false,
  actorMemberId: 7, letterId: 12, archiveCardId: null, createdAt: '2026-11-02T03:00:00Z', ...overrides,
});
const defer = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
};
const setup = (overrides: Partial<NotificationRepository> = {}) => {
  const calls: number[] = [];
  const store = createNotificationStore({
    list: async () => [item()], unreadCount: async () => ({ unreadCount: 0 }),
    markRead: async (id) => { calls.push(id); }, ...overrides,
  });
  return { store, calls };
};

test('전체 목록을 최신순으로 정렬하고 중복 알림을 한 번만 표시한다', async () => {
  const { store } = setup({ list: async () => [item(1), item(2, { createdAt: '2026-11-02T04:00:00Z' }), item(1)] });
  await store.load();
  assert.deepEqual(store.getSnapshot().items.map(notification => notification.id), [2, 1]);
  assert.equal(store.getSnapshot().loading, false);
  assert.equal(store.getSnapshot().loaded, true);
});

test('동시 목록·뱃지 조회를 합치고 빈 목록은 정상 결과로 처리한다', async () => {
  let lists = 0; let counts = 0;
  const { store } = setup({ list: async () => { lists++; return []; }, unreadCount: async () => { counts++; return { unreadCount: 0 }; } });
  await Promise.all([store.load(), store.load(), store.refreshUnread(), store.refreshUnread()]);
  assert.equal(lists, 1); assert.equal(counts, 1);
  assert.deepEqual(store.getSnapshot().items, []);
  assert.equal(store.getSnapshot().loaded, true);
});

test('읽음 성공 후에만 목록과 개수를 바꾸고 같은 항목의 동시 요청을 합친다', async () => {
  const read = defer<void>();
  let count = 1;
  const { store } = setup({ markRead: () => read.promise, unreadCount: async () => ({ unreadCount: count }) });
  await store.load(); await store.refreshUnread();
  const first = store.markRead(1);
  assert.equal(store.markRead(1), first);
  assert.equal(store.getSnapshot().items[0]!.read, false);
  assert.deepEqual(store.getSnapshot().pendingIds, [1]);
  count = 0; read.resolve();
  assert.equal(await first, true);
  assert.equal(store.getSnapshot().items[0]!.read, true);
  assert.equal(store.getSnapshot().unreadCount, 0);
  assert.deepEqual(store.getSnapshot().pendingIds, []);
});

test('이미 읽은 알림에는 PATCH를 다시 보내지 않는다', async () => {
  const { store, calls } = setup({ list: async () => [item(1, { read: true })] });
  await store.load();
  assert.equal(await store.markRead(1), true);
  assert.equal(await store.markRead(99), false);
  assert.deepEqual(calls, []);
});

test('읽음 실패는 기존 상태·오류 코드를 유지하며 재시도할 수 있다', async () => {
  let fail = true;
  const { store } = setup({ markRead: async () => { if (fail) throw new ApiError(404, 'NOTIFICATION_001', '존재하지 않는 알림입니다.'); } });
  await store.load();
  assert.equal(await store.markRead(1), false);
  assert.equal(store.getSnapshot().items[0]!.read, false);
  assert.equal(store.getSnapshot().readErrors[1]?.code, 'NOTIFICATION_001');
  fail = false;
  assert.equal(await store.markRead(1), true);
  assert.equal(store.getSnapshot().readErrors[1], undefined);
});

test('읽음 처리 중 시작된 오래된 목록이 읽음 상태를 되돌리지 않는다', async () => {
  let next = false;
  const response = defer<NotificationItem[]>();
  const { store } = setup({ list: () => next ? response.promise : Promise.resolve([item()]) });
  await store.load(); next = true;
  const pending = store.load();
  await store.markRead(1);
  response.resolve([item()]); await pending;
  assert.equal(store.getSnapshot().items[0]!.read, true);
});

test('읽음 처리 전의 늦은 개수 응답은 최신 개수를 덮어쓰지 않는다', async () => {
  const old = defer<{ unreadCount: number }>();
  let requests = 0;
  const { store } = setup({ unreadCount: () => ++requests === 1 ? old.promise : Promise.resolve({ unreadCount: 0 }) });
  await store.load();
  const pending = store.refreshUnread();
  await store.markRead(1);
  await store.refreshUnread();
  old.resolve({ unreadCount: 8 }); await pending;
  assert.equal(store.getSnapshot().unreadCount, 0);
});

test('서로 다른 알림을 동시에 읽어도 상태와 개수가 정확히 갱신된다', async () => {
  const first = defer<void>(); const second = defer<void>();
  const { store } = setup({ list: async () => [item(1), item(2)], markRead: id => id === 1 ? first.promise : second.promise });
  await store.load();
  const a = store.markRead(1); const b = store.markRead(2);
  second.resolve(); await b;
  assert.deepEqual(store.getSnapshot().pendingIds, [1]);
  first.resolve(); await a;
  assert.equal(store.getSnapshot().items.every(notification => notification.read), true);
  assert.deepEqual(store.getSnapshot().pendingIds, []);
});

test('로그아웃 후 이전 계정의 목록·개수·읽음 응답을 폐기한다', async () => {
  const list = defer<NotificationItem[]>(); const count = defer<{ unreadCount: number }>(); const read = defer<void>();
  let next = false;
  const { store } = setup({ list: () => next ? list.promise : Promise.resolve([item()]), unreadCount: () => count.promise, markRead: () => read.promise });
  await store.load(); next = true;
  const pendingList = store.load(); const pendingCount = store.refreshUnread(); const pendingRead = store.markRead(1);
  store.reset();
  list.resolve([item()]); count.resolve({ unreadCount: 9 }); read.resolve();
  await Promise.all([pendingList, pendingCount, pendingRead]);
  assert.deepEqual(store.getSnapshot().items, []);
  assert.equal(store.getSnapshot().unreadCount, null);
  assert.equal(store.getSnapshot().loaded, false);
});

test('갱신 실패 시 기존 목록·개수는 유지하고 오류 후 재조회가 가능하다', async () => {
  let fail = false;
  const { store } = setup({ list: async () => { if (fail) throw new ApiError(0, 'NETWORK_ERROR', '연결 실패'); return [item()]; }, unreadCount: async () => { if (fail) throw Error('offline'); return { unreadCount: 1 }; } });
  await store.load(); await store.refreshUnread(); fail = true;
  await store.load(); await store.refreshUnread();
  assert.equal(store.getSnapshot().items.length, 1);
  assert.equal(store.getSnapshot().unreadCount, 1);
  assert.equal(store.getSnapshot().error?.code, 'NETWORK_ERROR');
  fail = false; await store.load();
  assert.equal(store.getSnapshot().error, null);
});

test('동기적으로 실패한 저장소도 영구 로딩 상태가 되지 않는다', async () => {
  const { store } = setup({ list: () => { throw Error('sync failure'); } });
  await store.load(); await store.load();
  assert.equal(store.getSnapshot().loading, false);
  assert.equal(store.getSnapshot().error?.code, 'UNKNOWN_ERROR');
});

test('알림 유형·대상을 구분하며 새 유형과 누락된 ID를 안전하게 처리한다', () => {
  assert.equal(getNotificationLabel('LETTER'), '편지');
  assert.equal(getNotificationLabel('GIFT_SELECTED'), '두들픽');
  assert.equal(getNotificationLabel('NEW_TYPE'), '알림');
  assert.equal(getNotificationLabel('__proto__'), '알림');
  assert.deepEqual(getNotificationTarget(item()), { kind: 'letter', id: 12 });
  assert.deepEqual(getNotificationTarget(item(1, { type: 'COMMENT', letterId: null, archiveCardId: 4 })), { kind: 'archive', id: 4 });
  assert.deepEqual(getNotificationTarget(item(1, { type: 'FOLLOW_REQUEST', letterId: null })), { kind: 'friend', id: 7 });
  assert.equal(getNotificationTarget(item(1, { letterId: null, actorMemberId: null })), null);
});

test('시간 경계와 잘못된 날짜·미래 시각을 처리한다', () => {
  const date = '2026-11-02T03:00:00Z'; const now = Date.parse(date);
  assert.equal(formatNotificationTime(date, now + 59000), '방금 전');
  assert.equal(formatNotificationTime(date, now + 60000), '1분 전');
  assert.equal(formatNotificationTime(date, now + 3600000), '1시간 전');
  assert.equal(formatNotificationTime(date, now + 86400000), '1일 전');
  assert.match(formatNotificationTime(date, now + 7 * 86400000), /2026/);
  assert.equal(formatNotificationTime(date, now - 60000), '방금 전');
  assert.equal(formatNotificationTime('bad date', now), '시간 정보 없음');
});

test('HTTP 계약대로 인증 헤더를 붙이고 본문 없는 PATCH를 요청한다', async (t) => {
  const calls: { path: string; options: RequestInit }[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    const path = new URL(url).pathname; calls.push({ path, options });
    const data = path.endsWith('unread-count') ? { unreadCount: 1 } : options.method === 'PATCH' ? null : [item()];
    return new Response(JSON.stringify({ success: true, code: '200', message: 'OK', data }));
  });
  const repository = createHttpNotificationRepository(createHttpClient({ baseUrl: 'https://api.example.com', tokenStore: {
    getAccessToken: async () => 'access', getRefreshToken: async () => null, setTokens: async () => {}, setAccessToken: async () => {}, clear: async () => {},
  } }));
  assert.equal((await repository.list()).length, 1);
  assert.deepEqual(await repository.unreadCount(), { unreadCount: 1 });
  await repository.markRead(1);
  await assert.rejects(repository.markRead(-1), { code: 'COMMON_002' });
  assert.deepEqual(calls.map(({ path, options }) => [path, options.method]), [
    ['/api/mypage/notifications', 'GET'], ['/api/mypage/notifications/unread-count', 'GET'], ['/api/mypage/notifications/1/read', 'PATCH'],
  ]);
  assert.equal(calls[2]!.options.body, undefined);
  for (const call of calls) assert.equal(new Headers(call.options.headers).get('Authorization'), 'Bearer access');
});
