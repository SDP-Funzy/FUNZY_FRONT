'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { MypageShell } from '@/components/mypage/MypageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Popup } from '@/components/ui/Popup';

export const PasswordChangeScreen = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(null);
    if (!currentPassword) { setError('현재 비밀번호를 입력해 주세요.'); return; }
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) { setError('새 비밀번호는 8자 이상 영문·숫자·특수문자를 조합해 주세요.'); return; }
    if (new TextEncoder().encode(password).byteLength > 72) { setError('새 비밀번호는 72바이트 이하로 입력해 주세요.'); return; }
    if (password !== confirmation) { setError('새 비밀번호가 일치하지 않습니다.'); return; }
    if (currentPassword === password) { setError('현재 비밀번호와 다른 비밀번호를 입력해 주세요.'); return; }
    setCurrentPassword(''); setPassword(''); setConfirmation(''); setOpen(true);
  };
  return (
    <MypageShell title="비밀번호 변경">
      <form onSubmit={submit} noValidate className="mt-[40px] flex flex-1 flex-col px-page pb-[calc(68px+env(safe-area-inset-bottom,0px))]">
        <label htmlFor="current-password" className="mb-[12px] text-16">현재 비밀번호</label>
        <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setError(null); }} />
        <label htmlFor="changed-password" className="mt-[28px] mb-[12px] text-16">새 비밀번호</label>
        <Input id="changed-password" type="password" autoComplete="new-password" value={password} aria-describedby="password-preview-help"
          onChange={(event) => { setPassword(event.target.value); setError(null); }} />
        <p id="password-preview-help" className="mt-[8px] text-12 text-gray-m-400">8자 이상 영문·숫자·특수문자 조합, 72바이트 이하</p>
        <label htmlFor="changed-password-confirm" className="mt-[28px] mb-[12px] text-16">새 비밀번호 확인</label>
        <Input id="changed-password-confirm" type="password" autoComplete="new-password" value={confirmation}
          onChange={(event) => { setConfirmation(event.target.value); setError(null); }} />
        {error && <p role="alert" className="mt-[16px] text-12 text-error">{error}</p>}
        <div className="mt-auto pt-[40px]"><Button type="submit" disabled={!currentPassword || !password || !confirmation}>변경하기</Button></div>
      </form>
      <Popup isOpen={open} title="안내" description="입력 형식을 확인했어요. 비밀번호 변경 기능은 준비 중이에요." showCancel={false} onCancel={() => setOpen(false)} onConfirm={() => setOpen(false)} />
    </MypageShell>
  );
};
