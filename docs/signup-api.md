# 회원가입 API 연동 (#13)

회원가입 UI 확정 전 API와 상태 관리만 준비한다. 화면, 라우트, 디자인은 변경하지 않았다.

## 화면 연결

`apps/web/hooks/auth/useSignup.ts`의 `useSignup`을 사용한다.

1. 이메일 입력 변경 시 `setEmail(value)`를 호출한다.
2. `sendCode()`로 인증번호를 발송한다. 재발송 제한은 서버의 `AUTH_024`, `AUTH_025`로 안내한다.
3. `verifyCode(code)`로 6자리 인증번호를 확인한다.
4. 아이디 입력 변경 시 `setNickname(value)`를 호출하고 `checkNickname()`으로 중복 확인한다.
5. `submit({ password, passwordConfirm, termsAgreed, age14Confirmed, marketingConsent, adConsent })`를 호출한다. 동의값은 사용자의 실제 선택을 전달한다.
6. `submit`이 `true`이면 완료 안내 후 `/login`으로 이동한다. 자동 로그인하지 않는다.

아이디는 입력 시 소문자로 변환하며 중복 확인과 가입 요청에 동일한 값을 사용한다.
2~20자의 영문 소문자·숫자·마침표·밑줄만 허용하고 마침표로 시작·끝나거나 연속할 수 없다.
대소문자만 수정하여 정규화된 값이 같으면 기존 중복 확인 결과를 유지한다.
비밀번호는 조합·최소 길이 조건과 별도로 UTF-8 기준 72바이트 이하인지 검사한다. 비밀번호는 변환하거나 자르지 않는다.

액션은 성공 시 `true`, 실패·중복 요청·입력 변경으로 무효화된 응답은 `false`를 반환한다.
`pending` 동안 요청 버튼을 비활성화하고, 가입 요청 중에는 입력도 비활성화한다.
`error.code`로 오류를 구분하고 `error.message`를 표시한다. 중복 아이디는 `nicknameAvailable === false`로 안내한다.
`completed` 이후에는 가입을 다시 제출할 수 없다.

이메일 수정·인증번호 재발송 성공 시 이전 이메일 인증이 무효화된다.
아이디 수정 시 중복 확인이 무효화된다. 변경 전 입력에 대한 늦은 응답은 적용하지 않는다.
인증 토큰은 메모리에만 보관하며 30분 만료 또는 `AUTH_026` 응답 후 재인증해야 한다.
화면을 새로고침하거나 나가면 인증 상태도 초기화된다. 인증 완료 전에는 토큰을 저장하거나 로그인 상태를 바꾸지 않는다.

## API 계약

| 기능 | 요청 | 결과 |
| --- | --- | --- |
| 인증번호 발송 | `POST /api/auth/email/code`, `{ email }` | `data: null` |
| 인증번호 확인 | `POST /api/auth/email/code/verify`, `{ email, code }` | `{ verificationToken }` |
| 아이디 중복 확인 | `GET /api/auth/nickname/check?nickname=...` | `{ available }` |
| 가입 | `POST /api/auth/signup`, `SignupInput` | `data: null` |

모든 호출은 `auth: false`로 기존 Authorization 헤더 및 토큰 재발급을 사용하지 않는다.
서버 공통 응답은 기존 HttpClient가 처리하며 서버 오류 코드와 메시지를 보존한다.
가입 API에는 이메일 대신 인증 완료 토큰을 전달한다.

## 검증

`packages/core/tests/signup.test.ts`는 Node test runner용 테스트다. TypeScript 테스트를 esbuild로 묶어 실행할 수 있다.

```sh
pnpm --filter @sdp/core typecheck
pnpm --filter web exec tsc --noEmit
pnpm --filter web lint
npx --yes --package=esbuild@0.25.12 esbuild packages/core/tests/signup.test.ts --bundle --platform=node --format=cjs --outfile=node_modules/.cache/signup.test.cjs
node --test node_modules/.cache/signup.test.cjs
```

실제 이메일 발송·실계정 생성 및 브라우저 화면 검증은 UI가 확정된 뒤 진행한다. 이 단계에서는 #13을 닫지 않는다.
