'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Popup } from '@/components/ui/Popup';

export const AccountActions = () => {
  const [action, setAction] = useState<'logout' | 'withdraw' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const withdraw = action === 'withdraw';
  return (
    <>
      <footer className="mt-auto px-page pt-[40px] pb-[calc(68px+env(safe-area-inset-bottom,0px))]">
        <Button onClick={() => setAction('logout')}>로그아웃</Button>
        <button type="button" onClick={() => setAction('withdraw')} className="mx-auto mt-[16px] block p-[4px] text-12 text-gray-m-300 underline">회원탈퇴</button>
      </footer>
      <Popup isOpen={action !== null} title={withdraw ? 'FUNZY 회원 탈퇴' : '로그아웃'}
        description={withdraw ? '회원 탈퇴 시 계정 정보와 보관한 이미지가 삭제되어 복구할 수 없어요.\n정말 탈퇴하시겠어요?' : '로그아웃 하실까요?'}
        cancelLabel="취소" confirmLabel={withdraw ? '탈퇴하기' : '로그아웃'} onCancel={() => setAction(null)}
        onConfirm={() => {
          setNotice(withdraw ? '회원 탈퇴 기능은 준비 중이에요.' : '로그아웃 기능은 준비 중이에요.');
          setAction(null);
        }} />
      <Popup isOpen={notice !== null} title="안내" description={notice ?? undefined} showCancel={false}
        onCancel={() => setNotice(null)} onConfirm={() => setNotice(null)} />
    </>
  );
};
