'use client';

import { recoveryNeedsNewLink } from '@sdp/core';
import Link from 'next/link';

import { RecoveryFrame } from '@/components/auth/RecoveryFrame';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRecoveryAction } from '@/hooks/auth/useRecoveryAction';
import { accountRecovery } from '@/lib/accountRecoveryService';
import { ROUTES } from '@/lib/routes';

export const AccountUnlockScreen = ({ token }: { token: string }) => {
  const { markLoggedOut } = useAuth();
  const { pending, error, completed, run } = useRecoveryAction();
  const needsNewLink = !token.trim() || (error !== null && recoveryNeedsNewLink(error.code));

  const handleUnlock = async () => {
    if (completed || needsNewLink) return;
    if (await run(() => accountRecovery.unlockAccount(token))) markLoggedOut();
  };

  return (
    <RecoveryFrame title="계정 잠금 해제">
      {completed ? (
        <>
          <p role="status" className="text-16 text-gray-m-800">계정 잠금이 해제되었습니다. 기존 로그인은 모두 종료되었어요. 다시 로그인해 주세요.</p>
          <Button onClick={() => window.location.replace(ROUTES.login)}>로그인하기</Button>
        </>
      ) : needsNewLink ? (
        <>
          <p role="alert" className="text-14 text-error">{error?.message ?? '유효하지 않은 링크입니다.'} 잠금 해제 메일을 다시 요청해 주세요.</p>
          <Link href={ROUTES.accountUnlockRequest} className="text-16 font-semibold text-orange">잠금 해제 메일 다시 요청하기</Link>
        </>
      ) : (
        <>
          <p className="text-16 text-gray-m-800">버튼을 눌러 계정 잠금을 해제해 주세요. 잠금을 해제하면 기존 로그인도 모두 종료됩니다.</p>
          {error && <p role="alert" className="text-14 text-error">{error.message}</p>}
          <Button disabled={pending} onClick={() => { void handleUnlock(); }}>
            {pending ? '처리 중...' : '계정 잠금 해제하기'}
          </Button>
          <Link href={ROUTES.accountUnlockRequest} className="text-center text-14 text-orange">잠금 해제 메일 다시 요청하기</Link>
        </>
      )}
    </RecoveryFrame>
  );
};
