import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpArchiveRepository, archiveCommentText } from '../src/archive/HttpArchiveRepository';
import { createArchiveCommentsStore } from '../src/archive/ArchiveCommentsStore';
import type { ArchiveComment, ArchiveCommentPage } from '../src/archive/Archive';
import { createHttpClient } from '../src/shared/http/HttpClient';
import { createTokenStore } from '../src/shared/storage/TokenStore';
import { ApiError } from '../src/shared/http/ApiError';

const comment = (id: number): ArchiveComment => ({ commentId: id, parentCommentId: null, author: { memberId: 2, nickname: 'friend', profileImageUrl: null }, content: `댓글 ${id}`, replyCount: 0, mine: false, deletable: false, edited: false, createdAt: '2026-11-03T00:00:00Z' });
const page = (ids: number[], index = 0, last = true): ArchiveCommentPage => ({ comments: ids.map(comment), page: index, last, totalElements: 3, totalPages: 2 });
const client = () => createHttpClient({ baseUrl: 'https://api.test', tokenStore: createTokenStore({ getItem: async () => 'token', setItem: async () => {}, removeItem: async () => {} }) });
const response = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });

test('댓글 앞뒤 공백과 200자 제한을 API 요청 전에 처리한다', async t => {
  assert.equal(archiveCommentText('  안녕  '), '안녕');
  assert.equal(archiveCommentText('가'.repeat(200)).length, 200);
  let calls = 0; t.mock.method(globalThis, 'fetch', async () => { calls++; return response(comment(1)); });
  const repo = createHttpArchiveRepository(client());
  for (const text of [' ', '', '가'.repeat(201)]) { await assert.rejects(repo.createComment(1, text)); await assert.rejects(repo.updateComment(1, text)); }
  assert.equal(calls, 0);
});

test('댓글·답글·수정·삭제에 정확한 카드 ID와 댓글 ID를 사용한다', async t => {
  const calls: { url: string; method: string; body: unknown; auth: string | null }[] = [];
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined, auth: new Headers(init?.headers).get('Authorization') });
    return response(init?.method === 'GET' ? page([5]) : init?.method === 'DELETE' ? null : comment(5));
  });
  const repo = createHttpArchiveRepository(client());
  await repo.comments(9, 1); await repo.replies(9, 5, 2); await repo.createComment(9, ' 답글 ', 5); await repo.updateComment(5, ' 수정 '); await repo.deleteComment(5);
  assert.equal(calls[0]?.url, 'https://api.test/api/archive/cards/9/comments?page=1&size=20');
  assert.equal(calls[1]?.url, 'https://api.test/api/archive/cards/9/comments/5/replies?page=2&size=20');
  assert.deepEqual(calls[2]?.body, { content: '답글', parentCommentId: 5 });
  assert.equal(calls[3]?.method, 'PATCH'); assert.deepEqual(calls[3]?.body, { content: '수정' });
  assert.equal(calls[4]?.url, 'https://api.test/api/archive/comments/5'); assert.equal(calls[4]?.method, 'DELETE');
  assert.ok(calls.every(call => call.auth === 'Bearer token'));
});

test('잘못된 ID·페이지는 네트워크 요청을 보내지 않는다', async t => {
  let count = 0; t.mock.method(globalThis, 'fetch', async () => { count++; return response(page([])); });
  const repo = createHttpArchiveRepository(client());
  await assert.rejects(repo.detail(-1)); await assert.rejects(repo.comments(1, -1)); await assert.rejects(repo.replies(1, NaN)); await assert.rejects(repo.createComment(1, '안녕', 0));
  assert.throws(() => repo.deleteComment(0)); assert.equal(count, 0);
});

test('서버의 권한 오류를 성공으로 바꾸거나 자동 재요청하지 않는다', async t => {
  let count = 0; t.mock.method(globalThis, 'fetch', async () => { count++; return new Response(JSON.stringify({ success: false, code: 'COMMON_004', message: '권한이 없습니다.' }), { status: 403 }); });
  await assert.rejects(createHttpArchiveRepository(client()).updateComment(5, '수정'), (error: unknown) => error instanceof ApiError && error.code === 'COMMON_004');
  assert.equal(count, 1);
});

test('페이지 추가는 중복을 제거하고 동시에 두 번 요청하지 않는다', async () => {
  let count = 0;
  const store = createArchiveCommentsStore(async index => { count++; return index ? page([2, 3], 1) : page([1, 2], 0, false); });
  await store.load(); await Promise.all([store.more(), store.more()]);
  assert.deepEqual(store.getSnapshot().items.map(item => item.commentId), [1, 2, 3]); assert.equal(count, 2);
});

test('이전 요청의 늦은 응답은 새 목록을 덮어쓰지 않는다', async () => {
  let finish!: (value: ArchiveCommentPage) => void; let first = true;
  const store = createArchiveCommentsStore(async () => { if (first) { first = false; return new Promise(resolve => { finish = resolve; }); } return page([2]); });
  const old = store.load(); await store.load(); finish(page([1])); await old;
  assert.deepEqual(store.getSnapshot().items.map(item => item.commentId), [2]);
});

test('더 보기 실패 후에는 해당 페이지를 재시도하고 기존 목록을 유지한다', async () => {
  let fail = true; const indexes: number[] = [];
  const store = createArchiveCommentsStore(async index => { indexes.push(index); if (!index) return page([1], 0, false); if (fail) throw new Error('network'); return page([2], 1); });
  await store.load(); await store.more(); assert.deepEqual(store.getSnapshot().items.map(item => item.commentId), [1]);
  fail = false; await store.retry(); assert.deepEqual(indexes, [0, 1, 1]); assert.equal(store.getSnapshot().error, null);
});

test('목록 새로고침 실패는 첫 페이지를 다시 조회한다', async () => {
  let fail = false; const indexes: number[] = [];
  const store = createArchiveCommentsStore(async index => { indexes.push(index); if (fail) throw new Error('network'); return page([1]); });
  await store.load(); fail = true; await store.load(); fail = false; await store.retry(); assert.deepEqual(indexes, [0, 0, 0]);
});

test('접근 권한이 사라지면 기존 댓글 내용을 남기지 않는다', async () => {
  let denied = false; const store = createArchiveCommentsStore(async () => { if (denied) throw new ApiError(404, 'ARCHIVE_002', '카드 없음'); return page([1]); });
  await store.load(); denied = true; await store.load(); assert.deepEqual(store.getSnapshot().items, []); assert.equal(store.getSnapshot().loaded, false);
});

test('화면을 닫은 뒤 도착한 응답은 반영하지 않는다', async () => {
  let finish!: (value: ArchiveCommentPage) => void;
  const store = createArchiveCommentsStore(() => new Promise(resolve => { finish = resolve; }));
  const pending = store.load(); store.cancel(); finish(page([1])); await pending;
  assert.deepEqual(store.getSnapshot().items, []);
});
