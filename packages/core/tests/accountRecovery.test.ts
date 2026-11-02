import assert from 'node:assert/strict';
import { test } from 'node:test';

import { makeAccountRecovery, recoveryNeedsNewLink } from '../src/auth/application/AccountRecovery';
import type { AccountRecoveryRepository } from '../src/auth/application/AccountRecovery';
import { createHttpAccountRecoveryRepository } from '../src/auth/infra/HttpAccountRecoveryRepository';
import { ApiError } from '../src/shared/http/ApiError';
import { createHttpClient } from '../src/shared/http/HttpClient';
import { createTokenStore } from '../src/shared/storage/TokenStore';

const valid = { token: 'mail-token', newPassword: 'NewPassword1!', newPasswordConfirm: 'NewPassword1!' };

const setup = (overrides: Partial<AccountRecoveryRepository> = {}) => {
  let cleared = 0;
  const calls: unknown[] = [];
  const repository: AccountRecoveryRepository = {
    requestPasswordReset: async (email) => { calls.push(['reset-request', email]); },
    resetPassword: async (input) => { calls.push(['reset', input]); },
    requestAccountUnlock: async (email) => { calls.push(['unlock-request', email]); },
    unlockAccount: async (token) => { calls.push(['unlock', token]); },
    ...overrides,
  };
  const recovery = makeAccountRecovery(repository, { clear: async () => { cleared++; } });
  return { recovery, calls, getCleared: () => cleared };
};

test('메일 요청은 이메일을 정리하고 기존 세션을 유지한다', async () => {
  const { recovery, calls, getCleared } = setup();
  await recovery.requestPasswordReset(' member@example.com ');
  await recovery.requestAccountUnlock(' member@example.com ');
  assert.deepEqual(calls, [['reset-request', 'member@example.com'], ['unlock-request', 'member@example.com']]);
  assert.equal(getCleared(), 0);
});

test('잘못된 이메일은 서버에 보내지 않는다', async () => {
  const { recovery, calls } = setup();
  for (const email of ['', 'a', 'a @example.com']) {
    await assert.rejects(async () => recovery.requestPasswordReset(email), { code: 'COMMON_002' });
    await assert.rejects(async () => recovery.requestAccountUnlock(email), { code: 'COMMON_002' });
  }
  assert.equal(calls.length, 0);
});

test('복구가 성공한 뒤에만 저장된 로그인 세션을 지운다', async () => {
  const { recovery, calls, getCleared } = setup();
  await recovery.resetPassword(valid);
  assert.equal(getCleared(), 1);
  await recovery.unlockAccount('unlock-token');
  assert.equal(getCleared(), 2);
  assert.deepEqual(calls, [['reset', valid], ['unlock', 'unlock-token']]);
});

test('누락된 토큰은 서버에 보내지 않는다', async () => {
  const { recovery, calls, getCleared } = setup();
  for (const token of ['', '   ']) {
    await assert.rejects(recovery.resetPassword({ ...valid, token }), { code: 'AUTH_011' });
    await assert.rejects(recovery.unlockAccount(token), { code: 'AUTH_011' });
  }
  assert.equal(calls.length, 0);
  assert.equal(getCleared(), 0);
});

test('비밀번호 규칙·72바이트 상한·확인값을 요청 전에 검증한다', async () => {
  const { recovery, calls } = setup();
  for (const password of ['short', 'abcdefgh', 'Password1', 'A1!' + '가'.repeat(24), 'A1!' + 'a'.repeat(70)]) {
    await assert.rejects(recovery.resetPassword({ ...valid, newPassword: password, newPasswordConfirm: password }), { code: 'COMMON_002' });
  }
  await assert.rejects(recovery.resetPassword({ ...valid, newPasswordConfirm: 'Different1!' }), { code: 'AUTH_008' });
  assert.equal(calls.length, 0);
  for (const password of ['A1!' + '가'.repeat(23), 'A1!' + 'a'.repeat(69)]) {
    await recovery.resetPassword({ ...valid, newPassword: password, newPasswordConfirm: password });
  }
  assert.equal(calls.length, 2);
});

test('서버 오류 코드와 메시지를 그대로 보존하고 실패 시 세션을 유지한다', async () => {
  for (const code of ['AUTH_008', 'COMMON_002', 'AUTH_011', 'AUTH_028', 'AUTH_002', 'NETWORK_ERROR']) {
    const error = new ApiError(code === 'NETWORK_ERROR' ? 0 : 400, code, '서버 안내');
    const { recovery, getCleared } = setup({
      resetPassword: async () => { throw error; },
      unlockAccount: async () => { throw error; },
    });
    await assert.rejects(recovery.resetPassword(valid), (cause) => cause === error);
    await assert.rejects(recovery.unlockAccount(valid.token), (cause) => cause === error);
    assert.equal(getCleared(), 0);
  }
});

test('링크 소모 오류와 같은 링크로 수정할 수 있는 오류를 구분한다', () => {
  for (const code of ['AUTH_011', 'AUTH_028', 'AUTH_002']) assert.equal(recoveryNeedsNewLink(code), true);
  for (const code of ['AUTH_008', 'COMMON_002', 'NETWORK_ERROR']) assert.equal(recoveryNeedsNewLink(code), false);
});

test('네 복구 API는 문서의 경로·본문을 사용하고 로그인 토큰을 첨부하지 않는다', async (t) => {
  const calls: { url: string; options: RequestInit }[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ success: true, code: '200', message: 'OK', data: null }));
  });
  const forbidden = async (): Promise<never> => { throw new Error('기존 토큰에 접근하면 안 된다'); };
  const http = createHttpClient({ baseUrl: 'https://api.example.com', tokenStore: {
    getAccessToken: forbidden, getRefreshToken: forbidden,
    setTokens: forbidden, setAccessToken: forbidden, clear: forbidden,
  } });
  const repository = createHttpAccountRecoveryRepository(http);
  await repository.requestPasswordReset('member@example.com');
  await repository.resetPassword(valid);
  await repository.requestAccountUnlock('member@example.com');
  await repository.unlockAccount('unlock-token');
  assert.deepEqual(calls.map(({ url, options }) => [new URL(url).pathname, options.method, JSON.parse(options.body as string)]), [
    ['/api/auth/password/reset-request', 'POST', { email: 'member@example.com' }],
    ['/api/auth/password/reset', 'POST', valid],
    ['/api/auth/account/unlock-request', 'POST', { email: 'member@example.com' }],
    ['/api/auth/account/unlock', 'POST', { token: 'unlock-token' }],
  ]);
  for (const { options } of calls) assert.equal(new Headers(options.headers).has('Authorization'), false);
});

test('가입되지 않은 이메일도 API 성공 시 같은 성공 결과로 처리한다', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ success: true, code: '200', message: '요청 처리', data: null })));
  const store = createTokenStore({ getItem: async () => null, setItem: async () => {}, removeItem: async () => {} });
  const recovery = makeAccountRecovery(createHttpAccountRecoveryRepository(createHttpClient({ baseUrl: 'https://api.example.com', tokenStore: store })), store);
  assert.equal(await recovery.requestPasswordReset('missing@example.com'), undefined);
  assert.equal(await recovery.requestAccountUnlock('missing@example.com'), undefined);
});

test('AUTH_027은 토큰 재발급 없이 세션을 종료하고 로그인 이동을 알린다', async (t) => {
  let requests = 0;
  let expired = 0;
  const memory = new Map([['funzy.accessToken', 'access'], ['funzy.refreshToken', 'refresh']]);
  const tokenStore = createTokenStore({
    getItem: async (key) => memory.get(key) ?? null,
    setItem: async (key, value) => { memory.set(key, value); },
    removeItem: async (key) => { memory.delete(key); },
  });
  t.mock.method(globalThis, 'fetch', async () => {
    requests++;
    return new Response(JSON.stringify({ success: false, code: 'AUTH_027', message: '다시 로그인' }), { status: 401 });
  });
  const http = createHttpClient({ baseUrl: 'https://api.example.com', tokenStore, onSessionExpired: () => { expired++; } });
  await assert.rejects(http.get('/api/mypage/profile'), { code: 'AUTH_027' });
  assert.equal(requests, 1);
  assert.equal(memory.size, 0);
  assert.equal(expired, 1);
});
