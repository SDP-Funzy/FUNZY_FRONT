'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth/useAuth';
import { ROUTES } from '@/lib/routes';

import { Button } from '@/components/ui/Button';
import { Popup } from '@/components/ui/Popup';

export const AccountActions = () => {
  const { logout } = useAuth();
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [action, setAction] = useState<'logout' | 'withdraw' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const withdraw = action === 'withdraw';
  return (
    <>
      <footer className="mt-auto px-page pt-[40px] pb-[calc(68px+env(safe-area-inset-bottom,0px))]">
        <Button disabled={pending} onClick={() => setAction('logout')}>{pending ? '로그아웃 중...' : '로그아웃'}</Button>
        <button type="button" disabled={pending} onClick={() => setAction('withdraw')} className="mx-auto mt-[16px] block p-[4px] text-12 text-gray-m-300 underline">회원탈퇴</button>
      </footer>
      <Popup isOpen={action !== null} title={withdraw ? 'FUNZY 회원 탈퇴' : '로그아웃'}
        description={withdraw ? '회원 탈퇴 시 계정 정보와 보관한 이미지가 삭제되어 복구할 수 없어요.\n정말 탈퇴하시겠어요?' : '로그아웃 하실까요?'}
        cancelLabel="취소" confirmLabel={withdraw ? '탈퇴하기' : pending ? '로그아웃 중...' : '로그아웃'} onCancel={() => { if (!busy.current) setAction(null); }}
        onConfirm={async () => {
          if (busy.current) return;
          if (withdraw) { setNotice('회원 탈퇴 기능은 준비 중이에요.'); setAction(null); return; }
          busy.current = true; setPending(true);
          try { await logout(); router.replace(ROUTES.login); }
          catch { busy.current = false; setPending(false); setAction(null); setNotice('로그아웃을 완료하지 못했어요. 다시 시도해 주세요.'); }
        }} />
      <Popup isOpen={notice !== null} title="안내" description={notice ?? undefined} showCancel={false}
        onCancel={() => setNotice(null)} onConfirm={() => setNotice(null)} />
    </>
  );
};
