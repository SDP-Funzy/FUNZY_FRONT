import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpAccountSettingsRepository, makeChangePassword, validatePasswordChange } from '../src/mypage/AccountSettings';
import { createPushSettingsStore } from '../src/mypage/PushSettingsStore';
import { createHttpClient } from '../src/shared/http/HttpClient';
import { createTokenStore } from '../src/shared/storage/TokenStore';
import { ApiError } from '../src/shared/http/ApiError';
const input = { currentPassword: 'OldPassword1!', newPassword: 'NewPassword1!', newPasswordConfirm: 'NewPassword1!' };
test('빈칸·형식·72바이트·재확인·동일 비밀번호를 전송 전에 검사한다', () => {
  for (const item of [{ ...input, currentPassword: '' }, { ...input, newPassword: 'simple' }, { ...input, newPassword: 'a1!' + '가'.repeat(24), newPasswordConfirm: 'a1!' + '가'.repeat(24) }, { ...input, newPasswordConfirm: 'different' }, { ...input, newPassword: input.currentPassword, newPasswordConfirm: input.currentPassword }]) assert.throws(() => validatePasswordChange(item));
  assert.doesNotThrow(() => validatePasswordChange({ ...input, newPassword: 'a1!' + '가'.repeat(23), newPasswordConfirm: 'a1!' + '가'.repeat(23) }));
});
test('비밀번호 변경 성공 후에만 저장된 세션을 지운다', async () => {
  const calls: string[] = [];
  const change = makeChangePassword({ changePassword: async value => { assert.deepEqual(value, input); calls.push('patch'); } }, { clear: async () => { calls.push('clear'); } });
  await change(input); assert.deepEqual(calls, ['patch', 'clear']);
});
test('검증 오류와 서버 거절에는 토큰을 지우지 않는다', async () => {
  let requests = 0; let clears = 0;
  const change = makeChangePassword({ changePassword: async () => { requests++; throw new ApiError(400, 'AUTH_015', '현재 비밀번호 오류'); } }, { clear: async () => { clears++; } });
  await assert.rejects(change({ ...input, currentPassword: '' })); assert.equal(requests, 0);
  await assert.rejects(change(input)); assert.equal(requests, 1); assert.equal(clears, 0);
});
test('비밀번호 변경 중 중복 제출은 한 번만 요청한다', async () => {
  let requests = 0; let clears = 0;
  const change = makeChangePassword({ changePassword: async () => { requests++; } }, { clear: async () => { clears++; } });
  const first = change(input); const second = change(input); assert.equal(first, second); await first; assert.equal(requests, 1); assert.equal(clears, 1);
});
const http = () => createHttpClient({ baseUrl: 'https://api.test', tokenStore: createTokenStore({ getItem: async () => 'access', setItem: async () => {}, removeItem: async () => {} }) });
test('설정 API는 인증과 문서의 필드명을 사용한다', async t => {
  const calls: { path: string; method: string; body: unknown }[] = [];
  t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer access');
    calls.push({ path: new URL(String(url)).pathname, method: init?.method ?? '', body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify({ success: true, data: init?.method === 'GET' ? { pushNotificationEnabled: false } : null }), { status: 200 });
  });
  const repo = createHttpAccountSettingsRepository(http()); await repo.changePassword(input); assert.equal((await repo.pushSetting()).pushNotificationEnabled, false); await repo.updatePushSetting(true);
  assert.deepEqual(calls, [
    { path: '/api/mypage/account/password', method: 'PATCH', body: input },
    { path: '/api/mypage/notifications/settings', method: 'GET', body: undefined },
    { path: '/api/mypage/notifications/settings', method: 'PATCH', body: { pushNotificationEnabled: true } },
  ]);
});
test('잘못된 알림 응답을 OFF로 추정하지 않는다', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }));
  await assert.rejects(createHttpAccountSettingsRepository(http()).pushSetting(), (error: unknown) => error instanceof ApiError && error.code === 'SETTINGS_RESPONSE_INVALID');
});
test('알림 설정을 조회하기 전에는 저장하지 않는다', async () => {
  let saves = 0; const store = createPushSettingsStore({ pushSetting: async () => ({ pushNotificationEnabled: true }), updatePushSetting: async () => { saves++; } });
  assert.equal(await store.set(false), false); assert.equal(saves, 0); await store.load(); assert.equal(store.getSnapshot().enabled, true);
});
test('알림 저장 실패 시 기존 값을 유지하고 조회로 다시 확인한다', async () => {
  let enabled = true; let fail = true;
  const store = createPushSettingsStore({ pushSetting: async () => ({ pushNotificationEnabled: enabled }), updatePushSetting: async value => { if (fail) throw new Error('offline'); enabled = value; } });
  await store.load(); assert.equal(await store.set(false), false); assert.equal(store.getSnapshot().enabled, true); assert.ok(store.getSnapshot().error);
  fail = false; await store.set(false); assert.equal(store.getSnapshot().enabled, false); assert.equal(store.getSnapshot().error, null); await store.load(); assert.equal(store.getSnapshot().enabled, false);
});
test('알림 저장 중 연속 클릭과 새로고침은 저장을 중복하거나 덮어쓰지 않는다', async () => {
  let saves = 0; let gets = 0; let finish!: () => void;
  const store = createPushSettingsStore({ pushSetting: async () => { gets++; return { pushNotificationEnabled: true }; }, updatePushSetting: async () => { saves++; await new Promise<void>(resolve => { finish = resolve; }); } });
  await store.load(); const first = store.set(false); await store.set(false); await store.load(); assert.equal(saves, 1); assert.equal(gets, 1); assert.equal(store.getSnapshot().enabled, true); finish(); await first; assert.equal(store.getSnapshot().enabled, false);
});
test('이전 조회의 늦은 응답은 최신 알림 값을 덮어쓰지 않는다', async () => {
  let finish!: (value: { pushNotificationEnabled: boolean }) => void; let first = true;
  const store = createPushSettingsStore({ pushSetting: async () => { if (first) { first = false; return new Promise(resolve => { finish = resolve; }); } return { pushNotificationEnabled: false }; }, updatePushSetting: async () => {} });
  const previous = store.load(); await store.load(); finish({ pushNotificationEnabled: true }); await previous; assert.equal(store.getSnapshot().enabled, false);
});
test('화면을 닫은 뒤 도착한 저장 결과는 반영하지 않는다', async () => {
  let finish!: () => void;
  const store = createPushSettingsStore({ pushSetting: async () => ({ pushNotificationEnabled: true }), updatePushSetting: () => new Promise<void>(resolve => { finish = resolve; }) });
  await store.load(); const save = store.set(false); store.cancel(); finish(); await save; assert.equal(store.getSnapshot().enabled, true);
});
