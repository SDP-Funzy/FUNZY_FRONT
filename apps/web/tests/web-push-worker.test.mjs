import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

import vm from 'node:vm';
const source = readFileSync(new URL('../public/funzy-push-sw.js', import.meta.url), 'utf8');

function worker(backing = { active: false }) {
  const handlers = {}, shown = [], opened = [], moved = [];
  const self = {
    location: { origin: 'https://funzy.test' },
    addEventListener: (type, handler) => { handlers[type] = handler; },
    registration: { showNotification: async (title, options) => { shown.push({ title, ...options }); } },
    clients: { matchAll: async () => [], openWindow: async url => { opened.push(url); }, claim: async () => {} },
    skipWaiting: async () => {},
  };
  const indexedDB = { open: () => {
    const request = {};
    request.result = { createObjectStore() {}, close() {}, transaction: () => {
      const transaction = { objectStore: () => ({
        get: () => { const result = { result: backing.active }; queueMicrotask(() => transaction.oncomplete()); return result; },
        put: value => { backing.active = value; queueMicrotask(() => transaction.oncomplete()); return {}; },
      }) };
      return transaction;
    } };
    queueMicrotask(() => request.onsuccess()); return request;
  } };
  vm.runInNewContext(source, { self, indexedDB, URL });
  const dispatch = async (type, data) => { const pending = []; handlers[type]({ ...data, waitUntil: promise => pending.push(promise) }); await Promise.all(pending); };
  return { self, shown, opened, moved,
    active: value => dispatch('message', { data: { type: 'FUNZY_PUSH_STATUS', active: value }, ports: [{ postMessage: data => assert.equal(data.ok, true) }] }),
    push: payload => dispatch('push', { data: { json: () => payload } }),
    brokenPush: () => dispatch('push', { data: { json: () => { throw new Error('bad JSON'); } } }),
    click: (path, notificationId) => dispatch('notificationclick', { notification: { data: { path, notificationId }, close: () => moved.push('closed') } }),
  };
}

test('미연결·로그아웃 후에는 알림을 표시하지 않는다', async () => {
  const backing = { active: false }; const first = worker(backing);
  await first.push({ body: '비공개' }); assert.equal(first.shown.length, 0);
  await first.active(true); await first.push({ body: '새 알림' }); assert.equal(first.shown.length, 1);
  await first.active(false); const restarted = worker(backing); await restarted.push({ body: '이전 알림' }); assert.equal(restarted.shown.length, 0);
  await restarted.click('/letterbox/1'); assert.equal(restarted.opened.length, 0);
});
test('알림 유형별로 기존 화면과 같은 이동 경로를 만든다', async () => {
  const w = worker(); await w.active(true);
  const cases = [
    [{ type: 'LETTER', letterId: 12 }, '/letterbox/12'],
    [{ type: 'GIFT_SELECTED', letterId: 12 }, '/letterbox/12/gifts/result'],
    [{ type: 'COMMENT', archiveCardId: 3 }, '/archive/cards/3?comments=1'],
    [{ type: 'FOLLOW_REQUEST', actorMemberId: 7 }, '/friends/7'],
    [{ type: 'FOLLOW_ACCEPTED', actorMemberId: 7 }, '/friends/7'],
    [{ type: 'NEW', letterId: '12', url: 'https://other.test' }, '/notifications'],
  ];
  for (const [data, path] of cases) { await w.push({ ...data, notificationId: 1, title: '임의 제목', body: '알림 본문' }); const shown = w.shown.at(-1); assert.equal(shown.title, 'Funzy'); assert.equal(shown.body, '알림 본문'); assert.equal(shown.data.path, path); }
});
test('알림 클릭 시 같은 사이트 탭을 열고 외부 URL은 거부한다', async () => {
  const w = worker(); await w.active(true); await w.click('https://evil.test'); assert.equal(w.opened[0], 'https://funzy.test/notifications');
  w.self.clients.matchAll = async () => [{ url: 'https://other.test', navigate: async () => assert.fail('외부 탭'), focus: async () => {} }, { url: 'https://funzy.test/home', navigate: async url => { w.moved.push(url); }, focus: async () => { w.moved.push('focus'); } }];
  await w.click('/letterbox/12'); assert.ok(w.moved.includes('https://funzy.test/letterbox/12')); assert.equal(w.moved.at(-1), 'focus');
});
test('잘못된 알림 데이터도 안전한 기본 알림으로 표시한다', async () => {
  const w = worker(); await w.active(true); await w.brokenPush(); assert.equal(w.shown[0].data.path, '/notifications'); assert.equal(w.shown[0].body, '새로운 알림이 도착했어요.');
});
test('클릭한 알림 ID를 읽음 처리용으로 넘기고 기존 댓글 쿼리를 유지한다', async () => {
  const w = worker(); await w.active(true); await w.click('/archive/cards/3?comments=1', 101);
  assert.equal(w.opened[0], 'https://funzy.test/archive/cards/3?comments=1&notificationId=101');
  await w.click('/letterbox/12', '101'); assert.equal(w.opened[1], 'https://funzy.test/letterbox/12');
});
