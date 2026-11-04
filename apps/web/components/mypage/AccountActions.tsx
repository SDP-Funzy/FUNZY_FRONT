'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth/useAuth';
import { ROUTES } from '@/lib/routes';
import { withdrawAccount } from '@/lib/accountSettingsService';

import { Button } from '@/components/ui/Button';
import { Popup } from '@/components/ui/Popup';

export const AccountActions = () => {
  const { logout, markLoggedOut } = useAuth();
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [action, setAction] = useState<'logout' | 'withdraw' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const withdraw = action === 'withdraw';
  return (
    <>
      <footer className="mt-auto px-page pt-[40px] pb-[calc(34px+env(safe-area-inset-bottom,0px))]">
        <Button disabled={pending} onClick={() => setAction('logout')}>{pending ? '로그아웃 중...' : '로그아웃'}</Button>
        <button type="button" disabled={pending} onClick={() => setAction('withdraw')} className="mx-auto mt-[16px] block p-[4px] text-12 text-gray-m-300 underline">회원탈퇴</button>
      </footer>
      <Popup isOpen={action !== null} title={withdraw ? 'FUNZY 회원 탈퇴' : '로그아웃'}
        description={withdraw ? '탈퇴하면 계정 정보와 내 아카이브, 프로필 이미지 등이 삭제되어 복구할 수 없어요. 받은 편지는 내 편지함에서 사라지고, 공유 링크도 사용할 수 없어요. 상대방에게 남은 편지와 다른 사람의 카드에 작성한 댓글은 탈퇴한 회원으로 표시돼요. 모든 기기에서 로그아웃됩니다. 정말 탈퇴하시겠어요?' : '로그아웃 하실까요?'}
        cancelLabel="취소" confirmLabel={pending ? (withdraw ? '탈퇴 처리 중...' : '로그아웃 중...') : withdraw ? '탈퇴하기' : '로그아웃'} onCancel={() => { if (!busy.current) setAction(null); }}
        onConfirm={async () => {
          if (busy.current) return;
          busy.current = true; setPending(true);
          try {
            if (withdraw) { await withdrawAccount(); markLoggedOut(); }
            else await logout();
            router.replace(ROUTES.login);
          }
          catch { busy.current = false; setPending(false); setAction(null); setNotice(withdraw ? '탈퇴를 완료하지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.' : '로그아웃을 완료하지 못했어요. 다시 시도해 주세요.'); }
        }} />
      <Popup isOpen={notice !== null} title="안내" description={notice ?? undefined} showCancel={false}
        onCancel={() => setNotice(null)} onConfirm={() => setNotice(null)} />
    </>
  );
};
