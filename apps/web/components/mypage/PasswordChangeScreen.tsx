'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';

import { MypageShell } from '@/components/mypage/MypageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProfileLoadState } from '@/components/mypage/ProfileLoadState';
import { useMypageApi } from '@/components/mypage/MypageApiProvider';
import { useAuth } from '@/hooks/auth/useAuth';
import { changeAccountPassword } from '@/lib/accountSettingsService';
import { rememberPasswordChange } from '@/lib/passwordChangeNotice';
import { letterFailure } from '@/lib/letterService';
import { ROUTES } from '@/lib/routes';

export const PasswordChangeScreen = () => {
  const { connected } = useMypageApi();
  const { markLoggedOut } = useAuth(); const router = useRouter();
  const busy = useRef(false); const mounted = useRef(true);
  const [pending, setPending] = useState(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current || !connected.data?.hasPassword) return;
    busy.current = true; setPending(true); setError(null);
    try {
      await changeAccountPassword({ currentPassword, newPassword: password, newPasswordConfirm: confirmation });
      rememberPasswordChange();
      if (mounted.current) { setCurrentPassword(''); setPassword(''); setConfirmation(''); }
      markLoggedOut(); router.replace(ROUTES.login);
    } catch (cause) { if (mounted.current) setError(letterFailure(cause)); }
    finally { busy.current = false; if (mounted.current) setPending(false); }
  };
  if (!connected.data || connected.error) return <MypageShell title="비밀번호 변경"><ProfileLoadState error={connected.error} reload={connected.reload} /></MypageShell>;
  if (!connected.data.hasPassword) return <MypageShell title="비밀번호 변경"><p role="status" className="px-page py-[40px] text-14">소셜 전용 계정은 비밀번호를 변경할 수 없어요.</p></MypageShell>;
  return (
    <MypageShell title="비밀번호 변경">
      <form onSubmit={submit} noValidate className="mt-[40px] flex flex-1 flex-col px-page pb-[calc(68px+env(safe-area-inset-bottom,0px))]">
        <label htmlFor="current-password" className="mb-[12px] text-16">현재 비밀번호</label>
        <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} disabled={pending} onChange={(event) => { setCurrentPassword(event.target.value); setError(null); }} />
        <label htmlFor="changed-password" className="mt-[28px] mb-[12px] text-16">새 비밀번호</label>
        <Input id="changed-password" type="password" autoComplete="new-password" value={password} disabled={pending} aria-describedby="password-preview-help"
          onChange={(event) => { setPassword(event.target.value); setError(null); }} />
        <p id="password-preview-help" className="mt-[8px] text-12 text-gray-m-400">8자 이상 영문·숫자·특수문자 조합, 72바이트 이하</p>
        <label htmlFor="changed-password-confirm" className="mt-[28px] mb-[12px] text-16">새 비밀번호 확인</label>
        <Input id="changed-password-confirm" type="password" autoComplete="new-password" value={confirmation} disabled={pending}
          onChange={(event) => { setConfirmation(event.target.value); setError(null); }} />
        {error && <p role="alert" className="mt-[16px] text-12 text-error">{error}</p>}
        <div className="mt-auto pt-[40px]"><p className="mb-[12px] text-12 leading-[1.6] text-gray-m-400">변경하면 모든 기기에서 로그아웃돼요. 새 비밀번호로 다시 로그인해 주세요.</p><Button type="submit" disabled={pending || !currentPassword || !password || !confirmation}>{pending ? '변경 중...' : '변경하기'}</Button></div>
      </form>
    </MypageShell>
  );
};
