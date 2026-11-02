'use client';

import { SIGNUP_ERROR_CODES } from '@sdp/core';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { LoginInput } from '@/components/auth/LoginInput';
import { SignupTermsSheet } from '@/components/auth/SignupTermsSheet';
import type { SignupConsents } from '@/components/auth/SignupTermsSheet';
import { Button } from '@/components/ui/Button';
import { Popup } from '@/components/ui/Popup';
import { useSignup } from '@/hooks/auth/useSignup';
import { formatSignupCountdown, useSignupCountdown } from '@/hooks/auth/useSignupCountdown';
import { ROUTES } from '@/lib/routes';
import { authPathWithReturn } from '@/lib/sharedLetterReturn';

type Step = 'email' | 'code' | 'credentials' | 'complete';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SignupScreen = ({ returnTo }: { returnTo?: string | null }) => {
  const signup = useSignup();
  const [step, setStep] = useState<Step>('email');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [sent, setSent] = useState(false);
  const [codeDeadline, setCodeDeadline] = useState(0);
  const [resendDeadline, setResendDeadline] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [consents, setConsents] = useState<SignupConsents>({ terms: false, privacy: false, age14: false });
  const actionPending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const seconds = useSignupCountdown(codeDeadline);
  const resendSeconds = useSignupCountdown(resendDeadline);
  const pending = signup.pending !== null;
  const expiredCode = sent && ((codeDeadline !== 0 && seconds === 0) ||
    signup.error?.code === SIGNUP_ERROR_CODES.codeExpired || signup.error?.code === SIGNUP_ERROR_CODES.codeAttemptsExceeded);
  const error = localError ?? signup.error?.message ?? null;
  const emailValid = emailPattern.test(signup.email);
  const verificationExpired = signup.error?.code === SIGNUP_ERROR_CODES.verificationExpired;

  useEffect(() => { heading.current?.focus(); }, [step]);

  const updateEmail = (email: string) => {
    signup.setEmail(email);
    setCode(''); setSent(false); setCodeDeadline(0); setResendDeadline(0); setLocalError(null);
  };

  const sendCode = async () => {
    if (pending || actionPending.current || resendSeconds > 0) return;
    actionPending.current = true;
    setLocalError(null);
    try {
      if (await signup.sendCode()) {
        setSent(true); setCode('');
        setCodeDeadline(Date.now() + 5 * 60 * 1000);
        setResendDeadline(Date.now() + 60 * 1000);
      } else if (signup.getSnapshot().error?.code === SIGNUP_ERROR_CODES.resendCooldown) {
        setResendDeadline(Date.now() + 60 * 1000);
      }
    } finally { actionPending.current = false; }
  };

  const next = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || actionPending.current) return;
    setLocalError(null);
    if (step === 'email') {
      if (!emailValid) { setLocalError('이메일 주소를 확인해 주세요.'); return; }
      setStep('code'); return;
    }
    if (step === 'code') {
      if (!sent) { setNotice('먼저 인증번호를 받아 주세요.'); return; }
      if (!code) { setNotice('인증번호를 입력해 주세요.'); return; }
      if (expiredCode) { setLocalError('인증번호가 만료되었습니다. 다시 받아 주세요.'); return; }
      actionPending.current = true;
      try { if (await signup.verifyCode(code)) setStep('credentials'); }
      finally { actionPending.current = false; }
      return;
    }
    if (step !== 'credentials') return;
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      setLocalError('비밀번호는 8자 이상 영문, 숫자, 특수문자를 조합해 주세요.'); return;
    }
    if (new TextEncoder().encode(password).byteLength > 72) { setLocalError('비밀번호는 72바이트 이하로 입력해 주세요.'); return; }
    if (password !== confirmation) { setLocalError('비밀번호가 일치하지 않습니다.'); return; }
    actionPending.current = true;
    try {
      if (signup.nicknameAvailable !== true) await signup.checkNickname();
      if (signup.getSnapshot().nicknameAvailable === true) setTermsOpen(true);
    } finally { actionPending.current = false; }
  };

  const submit = async () => {
    if (!consents.terms || !consents.privacy || !consents.age14 || actionPending.current) return;
    actionPending.current = true;
    try {
      const succeeded = await signup.submit({ password, passwordConfirm: confirmation,
        termsAgreed: consents.terms && consents.privacy, age14Confirmed: consents.age14,
        marketingConsent: false, adConsent: false });
      if (succeeded) {
        setPassword(''); setConfirmation(''); setCode(''); setTermsOpen(false); setStep('complete');
      } else if (signup.getSnapshot().error?.code === SIGNUP_ERROR_CODES.verificationExpired) {
        setTermsOpen(false);
      } else if (signup.getSnapshot().error?.code === SIGNUP_ERROR_CODES.nicknameTaken) {
        setTermsOpen(false);
      } else if (signup.getSnapshot().error?.code === SIGNUP_ERROR_CODES.emailTaken) {
        setTermsOpen(false); setStep('email'); setSent(false); setCode('');
        setCodeDeadline(0); setResendDeadline(0);
      }
    } finally { actionPending.current = false; }
  };

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <div className="px-[24px] pt-[48px]">
        <Link href={authPathWithReturn(ROUTES.login, returnTo)} aria-label="로그인으로 돌아가기"><Image src="/images/logo-funzy-small.svg" alt="Funzy" width={83} height={56} priority /></Link>
      </div>
      {step === 'complete' ? (
        <div className="flex flex-1 flex-col px-page pt-[100px]">
          <h1 ref={heading} tabIndex={-1} className="text-24 leading-[1.35] font-bold outline-none">환영합니다<br />{signup.nickname}님,</h1>
          <p role="status" className="sr-only">회원가입이 완료되었습니다. 로그인해 주세요.</p>
          <div className="mt-auto pb-[calc(68px+env(safe-area-inset-bottom,0px))] pt-[40px]"><Button onClick={() => window.location.replace(authPathWithReturn(ROUTES.login, returnTo))}>로그인하기</Button></div>
        </div>
      ) : (
        <form onSubmit={next} noValidate className="flex flex-1 flex-col px-page">
          <h1 ref={heading} tabIndex={-1} className="mt-[64px] text-[22px] leading-[1.35] font-bold tracking-[-0.03em] outline-none">
            {step === 'credentials' ? <>안전한 서비스 사용을 위한<br />아이디와 비밀번호를 설정해주세요</> : <>회원가입을 위해<br />이메일을 입력해 주세요</>}
          </h1>
          <div className="mt-[36px] flex flex-col gap-[8px]">
            {step !== 'credentials' ? (
              <>
                <LoginInput aria-label="이메일" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
                  placeholder="이메일 주소를 입력해 주세요" value={signup.email} disabled={pending}
                  onChange={(event) => updateEmail(event.target.value)} />
                {step === 'code' && (
                  <>
                    <div className="relative">
                      <LoginInput aria-label="인증번호" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                        placeholder="인증번호를 입력해주세요" value={code} disabled={pending || !sent || expiredCode}
                        isError={expiredCode || signup.error?.code === SIGNUP_ERROR_CODES.codeMismatch}
                        aria-describedby="signup-error signup-code-help" className="pr-[72px]"
                        onChange={(event) => { setCode(event.target.value.replace(/\D/g, '')); signup.clearError(); setLocalError(null); }} />
                      {sent && <span aria-label="인증번호 남은 시간" className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2 text-12 text-gray-m-300">{formatSignupCountdown(seconds)}</span>}
                    </div>
                    <p id="signup-code-help" className="text-12 text-gray-m-500">인증번호는 5분 동안 유효해요. 재발송은 1분 후 가능해요.</p>
                    {(error || expiredCode) && <p id="signup-error" role="alert" className="text-12 leading-[1.5] text-error">{error ?? '인증번호가 만료되었습니다. 다시 받아 주세요.'}</p>}
                    <Button className="mt-[36px]" onClick={() => { void sendCode(); }} disabled={pending || !emailValid || resendSeconds > 0}>
                      {signup.pending === 'sendCode' ? '발송 중...' : resendSeconds > 0 ? `다시 받기 (${formatSignupCountdown(resendSeconds)})` : sent ? '인증번호 다시 받기' : '인증번호 받기'}
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <LoginInput aria-label="아이디" placeholder="아이디" autoComplete="username" autoCapitalize="none" spellCheck={false}
                  value={signup.nickname} disabled={pending} isError={signup.nicknameAvailable === false}
                  aria-describedby="signup-nickname-help signup-error" onChange={(event) => { signup.setNickname(event.target.value); setLocalError(null); }} />
                <div className="flex items-center justify-between gap-[8px]">
                  <p id="signup-nickname-help" className="text-12 text-gray-m-500">영문 소문자·숫자·마침표·밑줄, 2~20자</p>
                  <button type="button" disabled={pending || !signup.nickname} onClick={() => { void signup.checkNickname(); }} className="shrink-0 text-12 text-orange disabled:text-gray-m-200">중복 확인</button>
                </div>
                {signup.nicknameAvailable !== null && <p role="status" className={`text-12 ${signup.nicknameAvailable ? 'text-gray-m-500' : 'text-error'}`}>{signup.nicknameAvailable ? '사용할 수 있는 아이디예요.' : '이미 사용 중인 아이디입니다.'}</p>}
                <div className="mt-[36px] flex flex-col gap-[8px]">
                  <LoginInput aria-label="비밀번호" type="password" autoComplete="new-password" placeholder="비밀번호" value={password} disabled={pending}
                    aria-describedby="signup-password-help signup-error" onChange={(event) => { setPassword(event.target.value); signup.clearError(); setLocalError(null); }} />
                  <LoginInput aria-label="비밀번호 재확인" type="password" autoComplete="new-password" placeholder="비밀번호 재확인" value={confirmation} disabled={pending}
                    aria-describedby="signup-password-help signup-error" onChange={(event) => { setConfirmation(event.target.value); signup.clearError(); setLocalError(null); }} />
                  <p id="signup-password-help" className="text-12 text-gray-m-500">8자 이상, 영문·숫자·특수문자 조합 (72바이트 이하)</p>
                </div>
              </>
            )}
            {step !== 'code' && error && <p id="signup-error" role="alert" className="text-12 leading-[1.5] text-error">{error}</p>}
            {verificationExpired && <button type="button" className="text-left text-14 text-orange" onClick={() => { setStep('code'); setSent(false); setCode(''); setCodeDeadline(0); setResendDeadline(0); }}>이메일 다시 인증하기</button>}
          </div>
          <div className="mt-auto pt-[40px] pb-[calc(68px+env(safe-area-inset-bottom,0px))]">
            <Button ref={nextButton} type="submit" disabled={pending || (step === 'email' && !emailValid) || (step === 'code' && expiredCode) || (step === 'credentials' && (!signup.nickname || !password || !confirmation || verificationExpired))}>
              {pending ? '확인 중...' : step === 'code' ? '인증 요청' : '다음'}
            </Button>
          </div>
        </form>
      )}
      <Popup isOpen={notice !== null} title="인증번호" description={notice ?? ''} showCancel={false} confirmLabel="확인" onCancel={() => setNotice(null)} onConfirm={() => setNotice(null)} />
      <SignupTermsSheet open={termsOpen} pending={pending} value={consents} error={signup.error?.message ?? null} returnFocusRef={nextButton}
        onChange={setConsents} onClose={() => setTermsOpen(false)} onSubmit={() => { void submit(); }} />
    </div>
  );
};
