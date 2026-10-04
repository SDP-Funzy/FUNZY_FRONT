'use client';

import { isApiError, LOGIN_ERROR_CODES, NETWORK_ERROR_CODE } from '@sdp/core';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { LoginInput } from '@/components/auth/LoginInput';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { Popup } from '@/components/ui/Popup';
import { useAuth } from '@/hooks/auth/useAuth';
import { login } from '@/lib/authService';

type NoticeMessage = {
  title: string;
  description: string;
};

const COMING_SOON: NoticeMessage = {
  title: '준비 중이에요',
  description: '곧 사용할 수 있도록 준비하고 있어요.',
};

const NETWORK_FAILED: NoticeMessage = {
  title: '연결할 수 없어요',
  description: '네트워크 연결을 확인하고 다시 시도해 주세요.',
};

/**
 * 로그인 화면 (Figma 로그인 주황 버전)
 * - 아이디(닉네임) + 비밀번호로 로그인. 성공하면 로그인 상태가 되고, 화면 묶음의 AuthGuard 가 홈으로 보낸다
 * - 실패: 틀림(AUTH_001)은 입력칸 아래 문구, 잠김(AUTH_010)·네트워크 오류는 팝업
 * - 아이디 찾기, 비밀번호 찾기, 소셜 로그인은 준비 중 안내
 */
export const LoginScreen = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<NoticeMessage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { markLoggedIn } = useAuth();

  const isSubmittable = loginId.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSubmittable) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login({ nickname: loginId, password });
      markLoggedIn();
    } catch (error) {
      if (isApiError(error) && error.code === LOGIN_ERROR_CODES.invalidCredentials) {
        setErrorMessage(error.message);
      } else if (isApiError(error) && error.code === LOGIN_ERROR_CODES.locked) {
        setNotice({ title: '로그인이 잠겼어요', description: error.message });
      } else if (isApiError(error) && error.code === NETWORK_ERROR_CODE) {
        setNotice(NETWORK_FAILED);
      } else {
        setNotice({ title: '로그인하지 못했어요', description: isApiError(error) ? error.message : '잠시 후 다시 시도해 주세요.' });
      }
      setIsSubmitting(false);
    }
  };

  const showComingSoon = () => setNotice(COMING_SOON);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-page py-[40px]">
      <h1 className="sr-only">로그인</h1>
      <Image
        src="/images/logo-funzy-orange.png"
        alt="Funzy"
        width={201}
        height={152}
        priority
        className="h-auto w-[201px]"
      />

      <form onSubmit={handleSubmit} className="mt-[28px] flex w-full max-w-[320px] flex-col gap-[8px]">
        <LoginInput
          aria-label="아이디"
          placeholder="아이디 입력"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={loginId}
          isError={errorMessage !== null}
          aria-describedby={errorMessage ? 'login-error' : undefined}
          onChange={(e) => {
            setLoginId(e.target.value);
            setErrorMessage(null);
          }}
        />
        <LoginInput
          aria-label="비밀번호"
          type="password"
          placeholder="비밀번호 입력"
          autoComplete="current-password"
          value={password}
          isError={errorMessage !== null}
          aria-describedby={errorMessage ? 'login-error' : undefined}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrorMessage(null);
          }}
        />
        {errorMessage && (
          <p id="login-error" role="alert" className="pl-[4px] text-12 font-medium text-error">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={!isSubmittable}
          className="h-[48px] w-full rounded-control bg-orange text-16 leading-[1.55] font-medium text-gray-m-800 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="mt-[33px] flex items-center gap-[8px] text-14 leading-[26px] font-medium text-black">
        <button type="button" onClick={showComingSoon}>
          아이디 찾기
        </button>
        <span aria-hidden className="h-[14px] w-px bg-gray-m-100" />
        <button type="button" onClick={showComingSoon}>
          비밀번호 찾기
        </button>
      </div>

      <p className="mt-[11px] flex items-center gap-[13px] text-[10px] leading-[1.5]">
        <span className="font-medium text-gray-pc-500">계정이 없으신가요?</span>
        <Link href="/signup" className="font-semibold text-orange">
          회원가입하기
        </Link>
      </p>

      <div className="mt-[46px] flex w-full max-w-[315px] items-center gap-[15px]">
        <span aria-hidden className="h-px flex-1 bg-gray-m-100" />
        <span className="text-14 leading-[26px] font-medium text-gray-m-200">또는</span>
        <span aria-hidden className="h-px flex-1 bg-gray-m-100" />
      </div>

      <div className="mt-[17px]">
        <SocialLoginButtons onSelect={showComingSoon} />
      </div>

      <Popup
        isOpen={notice !== null}
        title={notice?.title ?? ''}
        description={notice?.description}
        confirmLabel="확인"
        showCancel={false}
        onCancel={() => setNotice(null)}
        onConfirm={() => setNotice(null)}
      />
    </div>
  );
};
