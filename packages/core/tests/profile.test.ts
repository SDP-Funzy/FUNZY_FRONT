import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpProfileRepository } from '../src/mypage/Profile';
import { createHttpClient } from '../src/shared/http/HttpClient';
import { createTokenStore } from '../src/shared/storage/TokenStore';
import { makeLogout } from '../src/auth/application/Logout';
import { createHttpAuthRepository } from '../src/auth/infra/HttpAuthRepository';
import { ApiError } from '../src/shared/http/ApiError';

const setup = async (tokens = true) => {
  const values = new Map<string, string>();
  const tokenStore = createTokenStore({ getItem: async key => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); }, removeItem: async key => { values.delete(key); } });
  if (tokens) await tokenStore.setTokens({ accessToken: 'access', refreshToken: 'refresh' });
  const http = createHttpClient({ baseUrl: 'https://api.test', tokenStore });
  return { tokenStore, repo: createHttpProfileRepository(http), logout: makeLogout({ tokenStore, authRepository: createHttpAuthRepository(http) }) };
};
const response = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
test('프로필은 인증을 포함해 조회하고 서버의 아이디·사진·가입 방식을 반환한다', async t => {
  const expected = { nickname: 'real.user', profileImageUrl: 'https://image.test/profile.jpg', provider: 'GOOGLE' };
  t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL, init?: RequestInit) => { assert.equal(String(url), 'https://api.test/api/mypage/profile'); assert.equal(init?.method, 'GET'); assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer access'); return response(expected); });
  assert.deepEqual(await (await setup()).repo.profile(), expected);
});
test('없는 사진은 null로 유지하고 비밀번호 보유 여부는 가입 방식으로 추정하지 않는다', async t => {
  t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL) => response(String(url).endsWith('/connected') ? { connectedProviders: ['GOOGLE'], hasPassword: true } : { nickname: 'social.user', profileImageUrl: null, provider: 'GOOGLE' }));
  const { repo } = await setup(); assert.equal((await repo.profile()).profileImageUrl, null); assert.equal((await repo.connected()).hasPassword, true);
});
test('비정상 프로필 응답을 샘플 사용자 정보로 바꾸지 않고 오류로 처리한다', async t => {
  t.mock.method(globalThis, 'fetch', async () => response({ nickname: '', profileImageUrl: null, provider: 'UNKNOWN' }));
  await assert.rejects((await setup()).repo.profile(), (error: unknown) => error instanceof ApiError && error.code === 'PROFILE_RESPONSE_INVALID');
});
test('로그아웃은 현재 refresh token을 서버에 전달하고 저장된 토큰을 모두 지운다', async t => {
  let count = 0;
  t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL, init?: RequestInit) => { count++; assert.equal(String(url), 'https://api.test/api/mypage/account/logout'); assert.equal(init?.method, 'POST'); assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer access'); assert.deepEqual(JSON.parse(String(init?.body)), { refreshToken: 'refresh' }); return response(null); });
  const { logout, tokenStore } = await setup(); await logout(); assert.equal(count, 1); assert.equal(await tokenStore.getAccessToken(), null); assert.equal(await tokenStore.getRefreshToken(), null);
});
test('로그아웃 서버 요청이 실패해도 이 기기의 토큰은 지운다', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  const { logout, tokenStore } = await setup(); await logout(); assert.equal(await tokenStore.getAccessToken(), null); assert.equal(await tokenStore.getRefreshToken(), null);
});
test('refresh token이 없으면 서버 요청 없이 로그아웃한다', async t => {
  let count = 0; t.mock.method(globalThis, 'fetch', async () => { count++; return response(null); });
  const { logout, tokenStore } = await setup(false); await tokenStore.setAccessToken('access-only'); await logout(); assert.equal(count, 0); assert.equal(await tokenStore.getAccessToken(), null);
});
test('연결 계정 응답의 비밀번호 보유 여부가 없으면 거짓 값으로 추정하지 않는다', async t => {
  t.mock.method(globalThis, 'fetch', async () => response({ connectedProviders: ['LOCAL'] }));
  await assert.rejects((await setup()).repo.connected(), (error: unknown) => error instanceof ApiError && error.code === 'PROFILE_RESPONSE_INVALID');
});
