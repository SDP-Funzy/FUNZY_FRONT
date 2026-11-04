import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWithdrawAccount } from '../src/mypage/WithdrawAccount';
import { createHttpClient } from '../src/shared/http/HttpClient';
import { createTokenStore } from '../src/shared/storage/TokenStore';

test('인증된 DELETE 요청 성공 뒤에만 두 토큰을 삭제한다', async t => {
  const values = new Map([['accessToken', 'access'], ['refreshToken', 'refresh']]);
  const tokens = createTokenStore({ getItem: async key => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); }, removeItem: async key => { values.delete(key); } });
  await tokens.setTokens({ accessToken: 'access', refreshToken: 'refresh' });
  t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(url), 'https://api.test/api/mypage/account');
    assert.equal(init?.method, 'DELETE');
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer access');
    assert.equal(init?.body, undefined);
    assert.equal(await tokens.getAccessToken(), 'access');
    return new Response(JSON.stringify({ success: true, data: null }), { status: 200 });
  });
  await createWithdrawAccount(createHttpClient({ baseUrl: 'https://api.test', tokenStore: tokens }), tokens)();
  assert.equal(await tokens.getAccessToken(), null);
  assert.equal(await tokens.getRefreshToken(), null);
});

test('실패하면 토큰을 유지하고 다음 시도에서 다시 요청한다', async () => {
  let requests = 0; let clears = 0;
  const withdraw = createWithdrawAccount({ delete: async <T>() => { if (++requests === 1) throw new Error('offline'); return undefined as T; } }, { clear: async () => { clears++; } });
  await assert.rejects(withdraw());
  assert.equal(clears, 0);
  await withdraw();
  assert.equal(requests, 2);
  assert.equal(clears, 1);
});

test('처리 중 연속 요청은 같은 작업을 공유한다', async () => {
  let finish!: () => void; let requests = 0; let clears = 0;
  const withdraw = createWithdrawAccount({ delete: async <T>() => { requests++; await new Promise<void>(resolve => { finish = resolve; }); return undefined as T; } }, { clear: async () => { clears++; } });
  const first = withdraw(); const second = withdraw();
  assert.equal(first, second); assert.equal(requests, 1); assert.equal(clears, 0);
  finish(); await first; assert.equal(clears, 1);
});
