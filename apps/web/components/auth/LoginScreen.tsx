'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { LoginInput } from '@/components/auth/LoginInput';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { Popup } from '@/components/ui/Popup';

type NoticeMessage = {
  title: string;
  description: string;
};

const COMING_SOON: NoticeMessage = {
  title: '준비 중이에요',
  description: '곧 사용할 수 있도록 준비하고 있어요.',
};

const LOGIN_NOT_CONNECTED: NoticeMessage = {
  title: '준비 중이에요',
  description: '로그인은 서버 연동 후 사용할 수 있어요.',
};

/**
 * 로그인 화면 (Figma 로그인 주황 버전)
 * - 로그인 버튼은 아직 API 연결 전이라 안내 팝업만 띄운다 (로그인 API 연동 이슈에서 연결)
 * - 아이디 찾기, 비밀번호 찾기, 소셜 로그인도 준비 중 안내
 */
export const LoginScreen = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<NoticeMessage | null>(null);

  const isSubmittable = loginId.trim().length > 0 && password.length > 0;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSubmittable) return;
    // TODO: 로그인 API 연동 이슈에서 core 의 로그인 유스케이스 호출로 교체
    setNotice(LOGIN_NOT_CONNECTED);
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
          onChange={(e) => setLoginId(e.target.value)}
        />
        <LoginInput
          aria-label="비밀번호"
          type="password"
          placeholder="비밀번호 입력"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={!isSubmittable}
          className="h-[48px] w-full rounded-control bg-orange text-16 leading-[1.55] font-medium text-gray-m-800 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          로그인
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
