import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpProfileRepository, validateProfileNickname, validateProfilePhoto } from '../src/mypage/Profile';
import type { MemberProfile, ProfileImageUpload, ProfilePhoto, ProfileRepository } from '../src/mypage/Profile';
import { createProfilePhotoUpload } from '../src/mypage/ProfilePhotoUpload';
import { createHttpClient } from '../src/shared/http/HttpClient';
import { createTokenStore } from '../src/shared/storage/TokenStore';
import { ApiError } from '../src/shared/http/ApiError';

const original: MemberProfile = { nickname: 'original.id', profileImageUrl: null, provider: 'LOCAL' };
const target: ProfileImageUpload = { uploadUrl: 'https://storage.test/upload', imageUrl: 'https://image.test/profile.png', imageKey: 'profiles/1/key.png', method: 'PUT', expiresAt: '2099-01-01T00:00:00Z' };
const photo = (): ProfilePhoto => ({ type: 'image/png', size: 10, body: {} });
const setup = () => {
  let current = { ...original };
  const calls: string[] = [];
  const repo: Pick<ProfileRepository, 'presignImage' | 'completeImage' | 'profile'> = {
    presignImage: async () => { calls.push('presign'); return target; },
    completeImage: async key => { calls.push(`complete:${key}`); current = { ...current, profileImageUrl: target.imageUrl }; return current; },
    profile: async () => { calls.push('get'); return current; },
  };
  const upload = async () => { calls.push('upload'); };
  return { repo, calls, upload, getCurrent: () => current };
};
test('아이디는 2~20자와 마침표 규칙을 검사한다', () => {
  for (const value of ['a', 'a'.repeat(21), '.abc', 'abc.', 'a..b', 'Abc', '한글', 'a b', '   ']) assert.throws(() => validateProfileNickname(value));
  assert.equal(validateProfileNickname(' abc_123.id '), 'abc_123.id');
});
test('지원하지 않는 형식·빈 파일·5MB 초과 사진은 업로드 전에 거절한다', async () => {
  const { repo, calls, upload } = setup(); const flow = createProfilePhotoUpload(repo, upload);
  for (const invalid of [{ ...photo(), type: 'image/gif' }, { ...photo(), size: 0 }, { ...photo(), size: 5 * 1024 * 1024 + 1 }]) await assert.rejects(flow.send(invalid));
  assert.deepEqual(calls, []); assert.doesNotThrow(() => validateProfilePhoto({ ...photo(), size: 5 * 1024 * 1024 }));
});
test('발급 → 직접 업로드 → 완료 순서로 실행하고 서버 프로필을 반환한다', async () => {
  const { repo, calls, upload } = setup(); const result = await createProfilePhotoUpload(repo, upload).send(photo());
  assert.deepEqual(calls, ['presign', 'upload', `complete:${target.imageKey}`]); assert.equal(result.profileImageUrl, target.imageUrl);
});
test('같은 업로드의 연속 클릭은 하나의 요청만 실행한다', async () => {
  const { repo, calls, upload } = setup(); const flow = createProfilePhotoUpload(repo, upload); const file = photo();
  const first = flow.send(file); const second = flow.send(file); assert.equal(first, second); await first; assert.equal(calls.filter(call => call === 'upload').length, 1);
});
test('스토리지 업로드가 실패하면 완료 처리를 호출하지 않는다', async () => {
  const { repo, calls } = setup(); await assert.rejects(createProfilePhotoUpload(repo, async () => { throw new Error('upload failed'); }).send(photo()));
  assert.deepEqual(calls, ['presign']);
});
test('완료 처리만 실패하면 사진을 다시 올리지 않고 완료만 재시도한다', async () => {
  const { repo, calls, upload } = setup(); const complete = repo.completeImage; let fail = true;
  repo.completeImage = async key => { if (fail) { fail = false; calls.push('complete-failed'); throw new ApiError(503, 'ERROR', 'error'); } return complete(key); };
  const flow = createProfilePhotoUpload(repo, upload); const file = photo(); await assert.rejects(flow.send(file)); await flow.send(file);
  assert.equal(calls.filter(call => call === 'upload').length, 1); assert.ok(calls.includes('get')); assert.equal(calls.filter(call => call.startsWith('complete')).length, 2);
});
test('완료 응답 유실 후 프로필에 이미 반영돼 있으면 완료 요청도 반복하지 않는다', async () => {
  const { repo, calls, upload } = setup(); const complete = repo.completeImage;
  repo.completeImage = async key => { await complete(key); throw new ApiError(0, 'NETWORK_ERROR', 'lost'); };
  const flow = createProfilePhotoUpload(repo, upload); const file = photo(); await assert.rejects(flow.send(file)); const recovered = await flow.send(file);
  assert.equal(recovered.profileImageUrl, target.imageUrl); assert.equal(calls.filter(call => call.startsWith('complete')).length, 1); assert.equal(calls.filter(call => call === 'upload').length, 1);
});
test('다른 파일로 바꾸면 새 업로드를 수행한다', async () => {
  const { repo, calls, upload } = setup(); const flow = createProfilePhotoUpload(repo, upload); await flow.send(photo()); await flow.send(photo());
  assert.equal(calls.filter(call => call === 'upload').length, 2); assert.equal(calls.filter(call => call === 'presign').length, 2);
});
test('사진 업로드 중 화면·세션이 종료되면 완료 API를 시작하지 않는다', async () => {
  const { repo, calls } = setup(); const controller = new AbortController();
  const flow = createProfilePhotoUpload(repo, async () => { controller.abort(); });
  await assert.rejects(flow.send(photo(), controller.signal), (error: unknown) => error instanceof DOMException && error.name === 'AbortError');
  assert.ok(!calls.some(call => call.startsWith('complete')));
});

const http = () => createHttpClient({ baseUrl: 'https://api.test', tokenStore: createTokenStore({ getItem: async () => 'access', setItem: async () => {}, removeItem: async () => {} }) });
test('사진 발급은 contentType만 보내고 완료는 imageKey, 초기화는 DELETE를 사용한다', async t => {
  const calls: { path: string; method: string; body: unknown }[] = [];
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer access');
    const path = new URL(String(input)).pathname; calls.push({ path, method: init?.method ?? '', body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify({ success: true, data: path.endsWith('presigned-url') ? target : path.endsWith('complete') ? original : null }), { status: 200 });
  });
  const repo = createHttpProfileRepository(http()); await repo.presignImage(photo()); await repo.completeImage(target.imageKey); await repo.resetImage(); await repo.changeNickname('new.id');
  assert.deepEqual(calls, [
    { path: '/api/mypage/profile/image/presigned-url', method: 'POST', body: { contentType: 'image/png' } },
    { path: '/api/mypage/profile/image/complete', method: 'POST', body: { imageKey: target.imageKey } },
    { path: '/api/mypage/profile/image', method: 'DELETE', body: undefined },
    { path: '/api/mypage/profile/nickname', method: 'PATCH', body: { nickname: 'new.id' } },
  ]);
});
test('중복 아이디 오류는 성공으로 바꾸거나 자동 재요청하지 않는다', async t => {
  let count = 0; t.mock.method(globalThis, 'fetch', async () => { count++; return new Response(JSON.stringify({ success: false, code: 'AUTH_007', message: '이미 사용 중인 아이디입니다.' }), { status: 409 }); });
  await assert.rejects(createHttpProfileRepository(http()).changeNickname('taken.id'), (error: unknown) => error instanceof ApiError && error.code === 'AUTH_007'); assert.equal(count, 1);
});
test('만료된 업로드 URL 응답은 거절한다', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ success: true, data: { ...target, expiresAt: '2000-01-01T00:00:00Z' } }), { status: 200 }));
  await assert.rejects(createHttpProfileRepository(http()).presignImage(photo()));
});
