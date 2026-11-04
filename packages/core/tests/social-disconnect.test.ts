import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canDisconnectSocial, makeDisconnectSocial } from '../src/mypage/SocialDisconnect';
import { createHttpProfileRepository } from '../src/mypage/Profile';
import type { ConnectedAccounts } from '../src/mypage/Profile';
import type { SocialProvider } from '../src/mypage/SocialDisconnect';
import { ApiError } from '../src/shared/http/ApiError';
import { createHttpClient } from '../src/shared/http/HttpClient';
import { createTokenStore } from '../src/shared/storage/TokenStore';

test('마지막 소셜 로그인 수단은 보호하고 비밀번호나 다른 소셜이 있으면 허용한다', () => {
  assert.equal(canDisconnectSocial({ hasPassword: false, connectedProviders: ['GOOGLE'] }, 'GOOGLE'), false);
  assert.equal(canDisconnectSocial({ hasPassword: false, connectedProviders: ['GOOGLE', 'GOOGLE', 'LOCAL'] }, 'GOOGLE'), false);
  assert.equal(canDisconnectSocial({ hasPassword: true, connectedProviders: ['GOOGLE'] }, 'GOOGLE'), true);
  assert.equal(canDisconnectSocial({ hasPassword: false, connectedProviders: ['GOOGLE', 'NAVER'] }, 'GOOGLE'), true);
  assert.equal(canDisconnectSocial({ hasPassword: true, connectedProviders: [] }, 'GOOGLE'), false);
});
test('해제 직전에 최신 상태를 확인하고 마지막 수단이면 DELETE를 보내지 않는다', async () => {
  let deletes = 0;
  const run = makeDisconnectSocial({ connected: async () => ({ hasPassword: false, connectedProviders: ['GOOGLE'] }), disconnectSocial: async () => { deletes++; } });
  await assert.rejects(run('GOOGLE'), (error: unknown) => error instanceof ApiError && error.code === 'AUTH_020');
  assert.equal(deletes, 0);
});
test('이미 해제된 계정은 다시 삭제하지 않고 최신 상태를 반환한다', async () => {
  let deletes = 0;
  const run = makeDisconnectSocial({ connected: async () => ({ hasPassword: true, connectedProviders: [] }), disconnectSocial: async () => { deletes++; } });
  assert.equal((await run('GOOGLE')).confirmed, true); assert.equal(deletes, 0);
});
test('중복 요청은 한 번만 해제하고 성공 후 최신 연결 상태를 반환한다', async () => {
  let accounts: ConnectedAccounts = { hasPassword: false, connectedProviders: ['GOOGLE', 'NAVER'] }; let deletes = 0;
  const run = makeDisconnectSocial({ connected: async () => accounts, disconnectSocial: async provider => { deletes++; assert.equal(provider, 'GOOGLE'); accounts = { ...accounts, connectedProviders: ['NAVER'] }; } });
  const first = run('GOOGLE'); const second = run('GOOGLE'); assert.equal(first, second);
  assert.deepEqual(await first, { accounts: { hasPassword: false, connectedProviders: ['NAVER'] }, confirmed: true }); assert.equal(deletes, 1);
});
test('성공 후 재조회 실패나 지연 응답에는 해제한 계정을 남기지 않는다', async () => {
  for (const stale of [false, true]) {
    let reads = 0;
    const run = makeDisconnectSocial({ connected: async () => { if (++reads > 1 && !stale) throw new Error('offline'); return { hasPassword: true, connectedProviders: ['GOOGLE', 'KAKAO'] }; }, disconnectSocial: async () => {} });
    assert.deepEqual(await run('GOOGLE'), { accounts: { hasPassword: true, connectedProviders: ['KAKAO'] }, confirmed: false });
  }
});
test('서버 해제 후 응답 유실은 재삭제 대신 조회로 확인한다', async () => {
  let reads = 0; let deletes = 0;
  const run = makeDisconnectSocial({ connected: async () => ({ hasPassword: true, connectedProviders: ++reads === 1 ? ['GOOGLE'] : [] }), disconnectSocial: async () => { deletes++; throw new ApiError(0, 'NETWORK_ERROR', 'offline'); } });
  assert.deepEqual(await run('GOOGLE'), { accounts: { hasPassword: true, connectedProviders: [] }, confirmed: true }); assert.equal(deletes, 1);
});
test('서버 거절과 조회 실패를 성공으로 표시하지 않고 재시도할 수 있다', async () => {
  let fail = true;
  const run = makeDisconnectSocial({ connected: async () => ({ hasPassword: true, connectedProviders: ['GOOGLE'] }), disconnectSocial: async () => { if (fail) throw new ApiError(400, 'AUTH_020', '마지막 로그인 수단'); } });
  await assert.rejects(run('GOOGLE'), (error: unknown) => error instanceof ApiError && error.code === 'AUTH_020');
  fail = false; assert.equal((await run('GOOGLE')).confirmed, false);
  const offline = makeDisconnectSocial({ connected: async () => { throw new Error('offline'); }, disconnectSocial: async () => assert.fail('조회 실패 후 삭제하면 안 됨') });
  await assert.rejects(offline('GOOGLE'));
});
test('지원하지 않는 제공자와 취소된 요청은 삭제하지 않는다', async () => {
  let reads = 0;
  const run = makeDisconnectSocial({ connected: async () => { reads++; return { hasPassword: true, connectedProviders: ['GOOGLE'] }; }, disconnectSocial: async () => assert.fail('삭제하면 안 됨') });
  await assert.rejects(run('LOCAL' as SocialProvider));
  const abort = new AbortController(); abort.abort(); await assert.rejects(run('GOOGLE', abort.signal)); assert.equal(reads, 0);
});
test('해제 API는 인증된 DELETE를 사용하고 LOCAL·임의 경로를 거부한다', async t => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL, init?: RequestInit) => {
    requests++; assert.equal(String(url), 'https://api.test/api/mypage/account/connections/KAKAO'); assert.equal(init?.method, 'DELETE');
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer access'); assert.equal(init?.body, undefined);
    return new Response(JSON.stringify({ success: true, data: null }), { status: 200 });
  });
  const repo = createHttpProfileRepository(createHttpClient({ baseUrl: 'https://api.test', tokenStore: createTokenStore({ getItem: async () => 'access', setItem: async () => {}, removeItem: async () => assert.fail('토큰은 유지해야 함') }) }));
  await repo.disconnectSocial('KAKAO');
  await assert.rejects(repo.disconnectSocial('../logout' as SocialProvider)); assert.equal(requests, 1);
});
test('최신 상태 조회 중 화면을 닫으면 후속 삭제를 보내지 않는다', async () => {
  let finish!: (accounts: ConnectedAccounts) => void;
  const abort = new AbortController();
  const run = makeDisconnectSocial({ connected: () => new Promise(resolve => { finish = resolve; }), disconnectSocial: async () => assert.fail('취소 뒤 삭제하면 안 됨') });
  const pending = run('GOOGLE', abort.signal); abort.abort(); finish({ hasPassword: true, connectedProviders: ['GOOGLE'] }); await assert.rejects(pending);
});
