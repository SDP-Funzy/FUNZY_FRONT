import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createSignupFlow } from '../src/auth/application/Signup';
import type { SignupInput, SignupRepository } from '../src/auth/application/SignupRepository';
import { createHttpSignupRepository } from '../src/auth/infra/HttpSignupRepository';
import { ApiError } from '../src/shared/http/ApiError';
import { createHttpClient } from '../src/shared/http/HttpClient';

const details = {
  password: 'Password1!', passwordConfirm: 'Password1!',
  termsAgreed: true, age14Confirmed: true, marketingConsent: false, adConsent: false,
};
const setup = (overrides: Partial<SignupRepository> = {}, now?: () => number) => {
  const submitted: SignupInput[] = [];
  const repository: SignupRepository = {
    sendEmailCode: async () => {},
    verifyEmailCode: async () => ({ verificationToken: 'verified-email-token' }),
    checkNickname: async () => ({ available: true }),
    signup: async (input) => { submitted.push(input); },
    ...overrides,
  };
  const flow = createSignupFlow(repository, now);
  flow.setEmail('member@example.com');
  flow.setNickname('member');
  return { flow, submitted };
};
const prepare = async (flow: ReturnType<typeof createSignupFlow>) => {
  assert.equal(await flow.sendCode(), true);
  assert.equal(await flow.verifyCode('123456'), true);
  assert.equal(await flow.checkNickname(), true);
};

test('가입은 인증 토큰과 명시적인 약관 선택을 전달하고 자동 로그인하지 않는다', async () => {
  const { flow, submitted } = setup();
  await prepare(flow);
  assert.equal(await flow.submit(details), true);
  assert.deepEqual(submitted, [{ ...details, nickname: 'member', verificationToken: 'verified-email-token' }]);
  assert.equal(flow.getSnapshot().completed, true);
  assert.equal(flow.getSnapshot().emailVerified, false);
  assert.equal('verificationToken' in flow.getSnapshot(), false);
  assert.equal(await flow.submit(details), false);
  assert.equal(submitted.length, 1);
});

test('이메일 수정 및 재발송 성공 후 기존 인증을 가입에 사용할 수 없다', async () => {
  const { flow, submitted } = setup();
  await prepare(flow);
  flow.setEmail('changed@example.com');
  assert.equal(await flow.submit(details), false);
  assert.equal(flow.getSnapshot().error?.code, 'AUTH_026');
  await flow.verifyCode('123456');
  await flow.sendCode();
  assert.equal(await flow.submit(details), false);
  assert.equal(submitted.length, 0);
});

test('아이디 수정 및 사용 불가 응답 후 가입을 차단한다', async () => {
  const { flow, submitted } = setup();
  await prepare(flow);
  flow.setNickname('changed');
  assert.equal(await flow.submit(details), false);
  assert.equal(submitted.length, 0);
  const unavailable = setup({ checkNickname: async () => ({ available: false }) });
  await prepare(unavailable.flow);
  assert.equal(await unavailable.flow.submit(details), false);
});

test('비밀번호 규칙, 확인 불일치, 필수 동의 누락을 요청 전에 검증한다', async () => {
  const { flow, submitted } = setup();
  await prepare(flow);
  for (const patch of [{ password: 'short' }, { passwordConfirm: 'different' }, { termsAgreed: false }, { age14Confirmed: false }]) {
    assert.equal(await flow.submit({ ...details, ...patch }), false);
  }
  assert.equal(submitted.length, 0);
});

test('인증 토큰의 30분 만료와 서버의 AUTH_026 응답은 재인증이 필요하다', async () => {
  let clock = 0;
  const { flow, submitted } = setup({}, () => clock);
  await prepare(flow);
  clock = 30 * 60 * 1000;
  assert.equal(await flow.submit(details), false);
  assert.equal(flow.getSnapshot().emailVerified, false);
  assert.equal(submitted.length, 0);
  const serverExpired = setup({ signup: async () => { throw new ApiError(400, 'AUTH_026', '인증 만료'); } });
  await prepare(serverExpired.flow);
  assert.equal(await serverExpired.flow.submit(details), false);
  assert.equal(serverExpired.flow.getSnapshot().emailVerified, false);
});

test('오래된 이메일 인증 응답을 무시하고 연속 클릭은 중복 요청하지 않는다', async () => {
  let resolve!: (value: { verificationToken: string }) => void;
  let calls = 0;
  const { flow } = setup({ verifyEmailCode: () => {
    calls++;
    return new Promise((done) => { resolve = done; });
  } });
  const first = flow.verifyCode('123456');
  assert.equal(await flow.verifyCode('123456'), false);
  flow.setEmail('new@example.com');
  resolve({ verificationToken: 'old-email-token' });
  assert.equal(await first, false);
  assert.equal(calls, 1);
  assert.equal(flow.getSnapshot().emailVerified, false);
  assert.equal(flow.getSnapshot().pending, null);
});

test('오래된 아이디 중복 확인 응답을 무시한다', async () => {
  let resolve!: (value: { available: boolean }) => void;
  const { flow } = setup({ checkNickname: () => new Promise((done) => { resolve = done; }) });
  const checking = flow.checkNickname();
  flow.setNickname('new-member');
  resolve({ available: true });
  assert.equal(await checking, false);
  assert.equal(flow.getSnapshot().nicknameAvailable, null);
});

test('서버 오류 코드와 메시지를 보존하며 재시도가 가능하다', async () => {
  let attempts = 0;
  const { flow } = setup({ sendEmailCode: async () => {
    if (attempts++ === 0) throw new ApiError(429, 'AUTH_024', '1분 후 다시 요청');
  } });
  assert.equal(await flow.sendCode(), false);
  assert.equal(flow.getSnapshot().error?.code, 'AUTH_024');
  assert.equal(flow.getSnapshot().error?.message, '1분 후 다시 요청');
  assert.equal(await flow.sendCode(), true);
  assert.equal(flow.getSnapshot().error, null);
});

test('인증번호 만료와 입력 횟수 초과 응답을 보존한다', async () => {
  for (const code of ['AUTH_021', 'AUTH_022', 'AUTH_023', 'AUTH_025']) {
    const { flow } = setup({ verifyEmailCode: async () => { throw new ApiError(400, code, code); } });
    assert.equal(await flow.verifyCode('123456'), false);
    assert.equal(flow.getSnapshot().error?.code, code);
    assert.equal(flow.getSnapshot().pending, null);
  }
});

test('아이디의 대문자를 소문자로 변환하고 중복 확인과 가입에 같은 값을 전달한다', async () => {
  const checked: string[] = [];
  const { flow, submitted } = setup({ checkNickname: async (nickname) => {
    checked.push(nickname);
    return { available: true };
  } });
  flow.setNickname('Tiki_Kim.1');
  await prepare(flow);
  assert.equal(flow.getSnapshot().nickname, 'tiki_kim.1');
  flow.setNickname('TIKI_KIM.1');
  assert.equal(flow.getSnapshot().nicknameAvailable, true);
  assert.equal(await flow.submit(details), true);
  assert.deepEqual(checked, ['tiki_kim.1']);
  assert.equal(submitted[0]?.nickname, 'tiki_kim.1');
});

test('잘못된 아이디는 중복 확인 요청 전에 차단한다', async () => {
  let checks = 0;
  const { flow } = setup({ checkNickname: async () => {
    checks++;
    return { available: true };
  } });
  for (const nickname of ['', 'a', 'a'.repeat(21), '.ab', 'ab.', 'a..b', 'a-b', '한글', 'a b', ' ab', 'ab\n']) {
    flow.setNickname(nickname);
    assert.equal(await flow.checkNickname(), false, JSON.stringify(nickname));
    assert.equal(flow.getSnapshot().error?.code, 'COMMON_002');
    assert.notEqual(flow.getSnapshot().nicknameAvailable, true);
  }
  assert.equal(checks, 0);
  for (const nickname of ['ab', 'a'.repeat(20), '_a', 'a_', 'a.b', '12']) {
    flow.setNickname(nickname);
    assert.equal(await flow.checkNickname(), true, nickname);
  }
  assert.equal(checks, 6);
});

test('ASCII 및 다중 바이트 비밀번호는 UTF-8 72바이트까지 허용한다', async () => {
  for (const password of ['A1!' + 'a'.repeat(69), 'A1!' + '가'.repeat(23), 'A1!a' + '😀'.repeat(17)]) {
    assert.equal(new TextEncoder().encode(password).byteLength, 72);
    const { flow, submitted } = setup();
    await prepare(flow);
    assert.equal(await flow.submit({ ...details, password, passwordConfirm: password }), true);
    assert.equal(submitted[0]?.password, password);
  }
});

test('72바이트 초과 비밀번호는 서버로 보내거나 자르지 않는다', async () => {
  const { flow, submitted } = setup();
  await prepare(flow);
  for (const password of ['A1!' + 'a'.repeat(70), 'A1!' + '가'.repeat(24), 'A1!' + '😀'.repeat(18)]) {
    assert.equal(await flow.submit({ ...details, password, passwordConfirm: password }), false);
    assert.equal(flow.getSnapshot().error?.code, 'COMMON_002');
    assert.match(flow.getSnapshot().error!.message, /72바이트/);
  }
  assert.equal(submitted.length, 0);
  assert.equal(await flow.submit(details), true);
});

test('네 API의 HTTP 계약 및 기존 토큰 미첨부를 검증한다', async (t) => {
  const calls: { url: URL; options: RequestInit }[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    calls.push({ url: new URL(url), options });
    const data = url.includes('/verify') ? { verificationToken: 'token' }
      : url.includes('/check') ? { available: false } : null;
    return new Response(JSON.stringify({ success: true, code: '200', message: 'OK', data }), { status: 200 });
  });
  const http = createHttpClient({ baseUrl: 'https://api.example.com', tokenStore: {
    getAccessToken: async () => { throw new Error('가입에서 토큰을 읽으면 안 된다'); },
    getRefreshToken: async () => { throw new Error('가입에서 토큰을 읽으면 안 된다'); },
    setTokens: async () => { throw new Error('가입에서 토큰을 저장하면 안 된다'); },
    setAccessToken: async () => { throw new Error('가입에서 토큰을 저장하면 안 된다'); },
    clear: async () => { throw new Error('기존 세션을 삭제하면 안 된다'); },
  } });
  const repository = createHttpSignupRepository(http);
  await repository.sendEmailCode('test@example.com');
  assert.deepEqual(await repository.verifyEmailCode('test@example.com', '012345'), { verificationToken: 'token' });
  assert.deepEqual(await repository.checkNickname('테스트 & name'), { available: false });
  await repository.signup({ ...details, nickname: 'member', verificationToken: 'token' });
  assert.deepEqual(calls.map(({ url, options }) => [url.pathname, options.method]), [
    ['/api/auth/email/code', 'POST'], ['/api/auth/email/code/verify', 'POST'],
    ['/api/auth/nickname/check', 'GET'], ['/api/auth/signup', 'POST'],
  ]);
  assert.deepEqual(JSON.parse(calls[0]!.options.body as string), { email: 'test@example.com' });
  assert.deepEqual(JSON.parse(calls[1]!.options.body as string), { email: 'test@example.com', code: '012345' });
  assert.equal(calls[2]!.url.searchParams.get('nickname'), '테스트 & name');
  assert.deepEqual(JSON.parse(calls[3]!.options.body as string), { ...details, nickname: 'member', verificationToken: 'token' });
  for (const call of calls) assert.equal(new Headers(call.options.headers).has('Authorization'), false);
});
