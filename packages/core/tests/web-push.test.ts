import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpWebPushRepository, createWebPushController } from '../src/notification/WebPush';
import type { BrowserPushSubscription, PushBrowser, WebPushRepository } from '../src/notification/WebPush';
import { createHttpClient } from '../src/shared/http/HttpClient';
import { createTokenStore } from '../src/shared/storage/TokenStore';

const setup = () => {
  const calls: string[] = []; let permission: NotificationPermission = 'default'; let subscription: BrowserPushSubscription | null = null;
  let key: string | null = 'key'; let fail = false; let supported = true;
  const make = (value = 'key'): BrowserPushSubscription => ({ endpoint: 'https://fcm.googleapis.com/test', key: () => value, data: () => ({ endpoint: 'https://fcm.googleapis.com/test', keys: { p256dh: 'p', auth: 'a' } }), unsubscribe: async () => { calls.push('browser-remove'); subscription = null; return true; } });
  const repo: WebPushRepository = {
    publicKey: async () => { calls.push('key'); return key; },
    subscribe: async () => { calls.push('register'); if (fail) throw new Error('offline'); },
    unsubscribe: async () => { calls.push('server-remove'); if (fail) throw new Error('offline'); },
  };
  const browser: PushBrowser = {
    supported: () => supported, permission: () => permission,
    requestPermission: async () => { calls.push('permission'); permission = 'granted'; return permission; },
    subscription: async () => subscription,
    subscribe: async () => { calls.push('browser-create'); subscription = make(); return subscription; },
    active: async value => { calls.push(`active:${value}`); }, clearNotifications: async () => { calls.push('clear-notifications'); },
  };
  return { calls, repo, browser, make, controller: createWebPushController(repo, browser), permission: (value: NotificationPermission) => { permission = value; }, existing: (value: BrowserPushSubscription) => { subscription = value; }, key: (value: string | null) => { key = value; }, fail: (value: boolean) => { fail = value; }, supported: (value: boolean) => { supported = value; } };
};

test('자동 시작은 권한 창을 띄우지 않고 버튼에서 동기적으로 요청한다', async () => {
  const s = setup(); await s.controller.start(); assert.deepEqual(s.calls, []);
  const pending = s.controller.enable(); assert.deepEqual(s.calls, ['permission']);
  await pending; assert.equal(s.controller.getSnapshot().subscribed, true);
  assert.deepEqual(s.calls, ['permission', 'key', 'browser-create', 'register', 'active:true']);
});
test('허용된 기존 구독을 재사용하고 중복 시작은 한 번만 등록한다', async () => {
  const s = setup(); s.permission('granted'); s.existing(s.make());
  await Promise.all([s.controller.start(), s.controller.start()]);
  assert.deepEqual(s.calls, ['key', 'register', 'active:true']);
});
test('차단·미지원 환경에서는 구독과 권한 요청을 하지 않는다', async () => {
  const s = setup(); s.permission('denied'); await s.controller.start(); await s.controller.enable(); assert.deepEqual(s.calls, []);
  s.permission('granted'); s.supported(false); await s.controller.start(); await s.controller.enable(); assert.deepEqual(s.calls, []);
});
test('공개키가 null이면 브라우저 구독을 생성하지 않는다', async () => {
  const s = setup(); s.permission('granted'); s.key(null); await s.controller.start();
  assert.deepEqual(s.calls, ['key', 'active:false']); assert.equal(s.controller.getSnapshot().serverEnabled, false);
});
test('서버 등록 실패 시 새 브라우저 구독을 되돌리고 재시도한다', async () => {
  const s = setup(); s.permission('granted'); s.fail(true); await s.controller.start();
  assert.ok(s.calls.includes('browser-remove')); assert.ok(s.controller.getSnapshot().error); assert.equal(s.controller.getSnapshot().subscribed, false);
  s.fail(false); await s.controller.enable(); assert.equal(s.controller.getSnapshot().subscribed, true);
});
test('키가 변경되면 기존 구독을 해제하고 새 키로 등록한다', async () => {
  const s = setup(); s.permission('granted'); s.existing(s.make('old')); await s.controller.start();
  assert.deepEqual(s.calls, ['key', 'server-remove', 'browser-remove', 'browser-create', 'register', 'active:true']);
});
test('로그아웃은 표시 중지·알림 닫기·서버와 브라우저 구독 해제 순서로 처리한다', async () => {
  const s = setup(); s.permission('granted'); s.existing(s.make()); await s.controller.start(); s.calls.length = 0;
  await s.controller.stop(true);
  assert.deepEqual(s.calls, ['active:false', 'clear-notifications', 'server-remove', 'browser-remove']);
  assert.equal(s.controller.getSnapshot().subscribed, false);
});
test('서버 해제 실패에도 브라우저 구독을 해제하고 종료한다', async () => {
  const s = setup(); s.permission('granted'); s.existing(s.make()); s.fail(true); await s.controller.stop(true);
  assert.ok(s.calls.includes('browser-remove')); assert.ok(s.controller.getSnapshot().error); assert.equal(s.controller.getSnapshot().busy, false);
});
test('비로그인 정리는 서버 API를 호출하지 않는다', async () => {
  const s = setup(); s.existing(s.make()); await s.controller.stop(); assert.ok(s.calls.includes('browser-remove')); assert.ok(!s.calls.includes('server-remove'));
});
test('연결 중 로그아웃하면 늦은 응답으로 수신을 다시 활성화하지 않는다', async () => {
  const s = setup(); s.permission('granted'); let finish!: () => void;
  s.repo.subscribe = async () => { s.calls.push('register'); await new Promise<void>(resolve => { finish = resolve; }); };
  const connecting = s.controller.start();
  while (!finish) await new Promise(resolve => setTimeout(resolve, 0));
  const logout = s.controller.stop(true); finish(); await Promise.all([connecting, logout]);
  assert.ok(!s.calls.includes('active:true')); assert.equal(s.controller.getSnapshot().subscribed, false); assert.equal(s.controller.getSnapshot().busy, false);
});
test('웹 푸시 API는 인증 헤더와 문서의 PUT·DELETE 본문을 사용한다', async t => {
  const calls: { path: string; method: string; body: unknown }[] = [];
  const tokens = createTokenStore({ getItem: async () => 'access', setItem: async () => {}, removeItem: async () => {} });
  t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer access'); assert.ok(init?.signal);
    calls.push({ path: new URL(String(url)).pathname, method: init?.method ?? '', body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify({ success: true, data: init?.method === 'GET' ? { publicKey: null } : null }), { status: 200 });
  });
  const repo = createHttpWebPushRepository(createHttpClient({ baseUrl: 'https://api.test', tokenStore: tokens }));
  assert.equal(await repo.publicKey(), null); const data = { endpoint: 'https://fcm.googleapis.com/test', keys: { p256dh: 'p', auth: 'a' } };
  await repo.subscribe(data); await repo.unsubscribe(data.endpoint);
  assert.deepEqual(calls, [
    { path: '/api/mypage/notifications/push/public-key', method: 'GET', body: undefined },
    { path: '/api/mypage/notifications/push/subscriptions', method: 'PUT', body: data },
    { path: '/api/mypage/notifications/push/subscriptions', method: 'DELETE', body: { endpoint: data.endpoint } },
  ]);
});
