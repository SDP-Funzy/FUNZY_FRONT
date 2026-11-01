'use client';

import { recoveryNeedsNewLink } from '@sdp/core';
import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { LoginInput } from '@/components/auth/LoginInput';
import { RecoveryFrame } from '@/components/auth/RecoveryFrame';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRecoveryAction } from '@/hooks/auth/useRecoveryAction';
import { accountRecovery } from '@/lib/accountRecoveryService';
import { ROUTES } from '@/lib/routes';

export const PasswordResetScreen = ({ token }: { token: string }) => {
  const { markLoggedOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const { pending, error, completed, run } = useRecoveryAction();
  const needsNewLink = !token.trim() || (error !== null && recoveryNeedsNewLink(error.code));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (completed || needsNewLink) return;
    const succeeded = await run(() => accountRecovery.resetPassword({
      token, newPassword: password, newPasswordConfirm: confirmation,
    }));
    if (succeeded) {
      markLoggedOut();
      setPassword('');
      setConfirmation('');
    }
  };

  return (
    <RecoveryFrame title="비밀번호 재설정">
      {completed ? (
        <>
          <p role="status" className="text-16 text-gray-m-800">비밀번호가 변경되었습니다. 모든 기기에서 로그아웃되었어요. 새 비밀번호로 로그인해 주세요.</p>
          <Button onClick={() => window.location.replace(ROUTES.login)}>로그인하기</Button>
        </>
      ) : needsNewLink ? (
        <>
          <p role="alert" className="text-14 text-error">{error?.message ?? '유효하지 않은 링크입니다.'} 재설정 메일을 다시 요청해 주세요.</p>
          <Link href={ROUTES.passwordForgot} className="text-16 font-semibold text-orange">재설정 메일 다시 요청하기</Link>
        </>
      ) : (
        <>
          <p id="password-help" className="text-14 text-gray-m-800">새 비밀번호는 8자 이상 영문·숫자·특수문자를 조합해 주세요. UTF-8 기준 72바이트까지 사용할 수 있어요.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]" aria-busy={pending}>
            <label htmlFor="new-password" className="text-14 font-medium">새 비밀번호</label>
            <LoginInput
              id="new-password" aria-label="새 비밀번호" type="password" autoComplete="new-password"
              required disabled={pending} value={password} placeholder="새 비밀번호 입력"
              isError={error !== null} aria-describedby={error ? 'password-help reset-error' : 'password-help'}
              onChange={(event) => setPassword(event.target.value)}
            />
            <label htmlFor="new-password-confirm" className="text-14 font-medium">새 비밀번호 확인</label>
            <LoginInput
              id="new-password-confirm" aria-label="새 비밀번호 확인" type="password" autoComplete="new-password"
              required disabled={pending} value={confirmation} placeholder="새 비밀번호 다시 입력"
              isError={error !== null} aria-describedby={error ? 'reset-error' : undefined}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            {error && <p id="reset-error" role="alert" className="text-14 text-error">{error.message}</p>}
            <Button type="submit" disabled={pending || !password || !confirmation}>{pending ? '변경 중...' : '비밀번호 변경하기'}</Button>
          </form>
          <Link href={ROUTES.passwordForgot} className="text-center text-14 text-orange">재설정 메일 다시 요청하기</Link>
        </>
      )}
    </RecoveryFrame>
  );
};
