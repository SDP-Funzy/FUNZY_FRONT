'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { LoginInput } from '@/components/auth/LoginInput';
import { RecoveryFrame } from '@/components/auth/RecoveryFrame';
import { Button } from '@/components/ui/Button';
import { useRecoveryAction } from '@/hooks/auth/useRecoveryAction';
import { accountRecovery } from '@/lib/accountRecoveryService';
import { ROUTES } from '@/lib/routes';

export const RecoveryEmailScreen = ({ mode }: { mode: 'password' | 'unlock' }) => {
  const [email, setEmail] = useState('');
  const { pending, error, completed, run } = useRecoveryAction();
  const title = mode === 'password' ? '비밀번호 찾기' : '계정 잠금 해제';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await run(() => mode === 'password'
      ? accountRecovery.requestPasswordReset(email)
      : accountRecovery.requestAccountUnlock(email));
  };

  return (
    <RecoveryFrame title={title}>
      <p className="text-16 text-gray-m-800">가입할 때 사용한 이메일 주소를 입력해 주세요.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]" aria-busy={pending}>
        <label htmlFor="recovery-email" className="text-14 font-medium">이메일</label>
        <LoginInput
          id="recovery-email" aria-label="이메일" type="email" autoComplete="email"
          autoCapitalize="none" spellCheck={false} placeholder="이메일 입력"
          required value={email} disabled={pending} isError={error !== null}
          aria-describedby={error ? 'recovery-error' : undefined}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error && <p id="recovery-error" role="alert" className="text-14 text-error">{error.message}</p>}
        <Button type="submit" disabled={pending || !email.trim()}>
          {pending ? '요청 중...' : completed ? '메일 다시 요청하기' : '메일 요청하기'}
        </Button>
      </form>
      {completed && (
        <p role="status" className="text-14 text-gray-m-800">
          입력한 이메일에 해당하는 계정이 있으면 안내 메일이 발송됩니다. 메일함과 스팸함을 확인해 주세요.
          링크는 15분 동안 유효합니다. 메일이 오지 않으면 잠시 후 다시 요청해 주세요.
        </p>
      )}
      <Link href={ROUTES.login} className="text-center text-14 text-orange">로그인으로 돌아가기</Link>
    </RecoveryFrame>
  );
};
