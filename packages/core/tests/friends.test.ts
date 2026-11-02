import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFriendRequest, createHttpFriendsRepository } from '../src/friends/Friends';
import type { FollowStatus, FriendMember, FriendsRepository } from '../src/friends/Friends';
import { createHttpArchiveRepository } from '../src/archive/HttpArchiveRepository';
import { createHttpClient } from '../src/shared/http/HttpClient';
import { createTokenStore } from '../src/shared/storage/TokenStore';
import { ApiError } from '../src/shared/http/ApiError';

const member = (status: FollowStatus = 'NONE'): FriendMember => ({ memberId: 7, nickname: 'real.friend', profileImageUrl: null, followStatus: status, followRequestId: ['REQUESTED', 'RECEIVED'].includes(status) ? 9 : null });
const client = () => createHttpClient({ baseUrl: 'https://api.test', tokenStore: createTokenStore({ getItem: async () => 'access', setItem: async () => {}, removeItem: async () => {} }) });
const ok = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
test('검색어의 @·공백·대문자를 정리하고 인증을 포함해 서버에 조회한다', async t => {
  t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL, init?: RequestInit) => { assert.equal(String(url), 'https://api.test/api/social/members/search?nickname=real'); assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer access'); return ok([member('FRIEND')]); });
  assert.equal((await createHttpFriendsRepository(client()).search(' @ReAl '))[0]?.followStatus, 'FRIEND');
});
test('두 글자 미만 검색과 잘못된 회원 ID는 서버에 보내지 않는다', async t => {
  let count = 0; t.mock.method(globalThis, 'fetch', async () => { count++; return ok([]); });
  const repo = createHttpFriendsRepository(client());
  await assert.rejects(repo.search('@a')); await assert.rejects(repo.search(' ')); await assert.rejects(repo.member(-1)); assert.throws(() => repo.request(NaN)); assert.equal(count, 0);
});
test('검색의 서버 정렬을 유지하고 나 자신은 검색 결과에서 제외한다', async t => {
  t.mock.method(globalThis, 'fetch', async () => ok([{ ...member('SELF'), memberId: 1 }, { ...member('FRIEND'), memberId: 2 }, { ...member(), memberId: 3 }]));
  assert.deepEqual((await createHttpFriendsRepository(client()).search('re')).map(item => item.memberId), [2, 3]);
});
test('친구 요청은 memberId를 POST하고 결과는 회원 관계 재조회로 확인한다', async t => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL, init?: RequestInit) => { calls.push(`${init?.method} ${new URL(String(url)).pathname}`); if (init?.method === 'POST') { assert.deepEqual(JSON.parse(String(init.body)), { memberId: 7 }); return ok(null); } return ok(member('REQUESTED')); });
  const result = await createFriendRequest(createHttpFriendsRepository(client()), 7).send();
  assert.equal(result.followStatus, 'REQUESTED'); assert.deepEqual(calls, ['POST /api/social/follow/requests', 'GET /api/social/members/7']);
});
const setup = (status: FollowStatus = 'REQUESTED') => {
  const calls = { post: 0, get: 0 };
  const repo: FriendsRepository = { search: async () => [], member: async () => { calls.get++; return member(status); }, request: async () => { calls.post++; } };
  return { repo, calls };
};
test('요청 중 중복 클릭은 같은 작업을 공유한다', async () => {
  const { repo, calls } = setup(); const flow = createFriendRequest(repo, 7);
  const first = flow.send(); const second = flow.send(); assert.equal(first, second); await first; assert.equal(calls.post, 1);
});
test('교차 요청이면 요청함으로 추정하지 않고 서버의 친구 상태를 반영한다', async () => {
  const { repo } = setup('FRIEND'); assert.equal((await createFriendRequest(repo, 7, 'RECEIVED').send()).followStatus, 'FRIEND');
});
test('요청 성공 후 재조회가 실패하면 다시 요청하지 않고 조회만 재시도한다', async () => {
  const { repo, calls } = setup(); const original = repo.member; let fail = true;
  repo.member = async id => { if (fail) { fail = false; throw new Error('network'); } return original(id); };
  const flow = createFriendRequest(repo, 7); await assert.rejects(flow.send()); assert.equal((await flow.send()).followStatus, 'REQUESTED'); assert.equal(calls.post, 1);
});
test('이미 친구·이미 요청함 오류는 실제 관계를 조회해 일치시킨다', async () => {
  for (const code of ['SOCIAL_003', 'SOCIAL_004']) {
    const { repo } = setup(code === 'SOCIAL_003' ? 'FRIEND' : 'REQUESTED');
    repo.request = async () => { throw new ApiError(409, code, 'already'); };
    assert.equal((await createFriendRequest(repo, 7).send()).followStatus, code === 'SOCIAL_003' ? 'FRIEND' : 'REQUESTED');
  }
});
test('요청 응답 유실 시 관계를 먼저 조회해 중복 요청을 피한다', async () => {
  const { repo, calls } = setup(); repo.request = async () => { calls.post++; throw new ApiError(0, 'NETWORK_ERROR', 'offline'); };
  const flow = createFriendRequest(repo, 7); await assert.rejects(flow.send()); assert.equal((await flow.send()).followStatus, 'REQUESTED'); assert.equal(calls.post, 1);
});
test('친구 상한 오류는 성공으로 처리하지 않는다', async () => {
  const { repo } = setup('NONE'); repo.request = async () => { throw new ApiError(400, 'SOCIAL_005', '친구 수 상한'); };
  await assert.rejects(createFriendRequest(repo, 7).send(), (error: unknown) => error instanceof ApiError && error.code === 'SOCIAL_005');
});
test('친구 아카이브는 친구 전용 주소로 조회하고 주인 ID를 검증한다', async t => {
  let owner = 7;
  t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL) => { assert.equal(String(url), 'https://api.test/api/archive/friends/7/home'); return ok({ memberId: owner, nickname: 'real.friend', title: '아카이브', profileImageUrl: null, empty: true, sections: [] }); });
  const repo = createHttpArchiveRepository(client()); assert.equal((await repo.friendHome(7)).memberId, 7); owner = 8; await assert.rejects(repo.friendHome(7));
});
test('검색 제한 오류는 자동 재요청하거나 샘플 결과로 바꾸지 않는다', async t => {
  let count = 0; t.mock.method(globalThis, 'fetch', async () => { count++; return new Response(JSON.stringify({ success: false, code: 'SOCIAL_009', message: '잠시 후 검색해 주세요.' }), { status: 429 }); });
  await assert.rejects(createHttpFriendsRepository(client()).search('re'), (error: unknown) => error instanceof ApiError && error.code === 'SOCIAL_009'); assert.equal(count, 1);
});
