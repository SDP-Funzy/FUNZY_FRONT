'use client';
import { isProfileNickname } from '@sdp/core';
import { useRef, useState } from 'react';
import { ArchiveDialog } from '@/components/archive/ArchiveDialog';
import { AccountActions } from '@/components/mypage/AccountActions';
import { MypageShell } from '@/components/mypage/MypageShell';
import { ProfileAvatar } from '@/components/mypage/ProfileAvatar';
import { ProfileLoadState } from '@/components/mypage/ProfileLoadState';
import { useMypageApi } from '@/components/mypage/MypageApiProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Popup } from '@/components/ui/Popup';
import { letterFailure, letterImageUrl } from '@/lib/letterService';

const NicknameForm = ({ current }: { current: string }) => {
  const { editor } = useMypageApi();
  const [nickname, setNickname] = useState(current);
  const value = nickname.trim(); const valid = isProfileNickname(value); const changed = value !== current;
  const error = editor.errorKind === 'nickname' ? editor.error : null;
  const update = (next: string) => { setNickname(next); editor.clearNicknameError(); };
  const save = () => { if (valid && changed && !editor.pending) void editor.changeNickname(value); };
  return <form onSubmit={event => { event.preventDefault(); save(); }}>
    <label htmlFor="profile-nickname" className="mb-[12px] block text-16">아이디</label>
    <Input id="profile-nickname" value={nickname} maxLength={20} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" disabled={!!editor.pending} isError={!!error || (changed && !valid)} aria-describedby="profile-nickname-help profile-nickname-error" onChange={event => update(event.target.value)} onClear={() => update('')} onBlur={save} />
    <p id="profile-nickname-help" className={changed && !valid ? 'mt-[8px] text-12 leading-[1.6] text-error' : 'sr-only'}>영문 소문자·숫자·마침표·밑줄로 2~20자 입력해 주세요. 마침표는 처음·끝·연속으로 사용할 수 없어요. 입력을 마치고 다른 곳을 누르거나 Enter를 누르면 저장됩니다.</p>
    {!!error && <p id="profile-nickname-error" role="alert" className="mt-[8px] text-12 text-error">{letterFailure(error)}</p>}
  </form>;
};
export const ProfileEditScreen = () => {
  const { profile, editor } = useMypageApi();
  const fileInput = useRef<HTMLInputElement>(null);
  const [photoMenu, setPhotoMenu] = useState(false); const [resetConfirm, setResetConfirm] = useState(false);
  return <MypageShell title="프로필">
    {profile.data ? <>
      <div className="mx-auto mt-[24px] flex flex-col items-center px-page">
        <div className="relative"><ProfileAvatar src={letterImageUrl(profile.data.profileImageUrl) ?? null} large />
          <button type="button" aria-label="프로필 사진 선택" disabled={!!editor.pending} onClick={() => setPhotoMenu(true)} className="absolute right-0 bottom-0 flex size-[32px] items-center justify-center rounded-full border-2 border-cream bg-black text-white focus-visible:outline-2 focus-visible:outline-orange disabled:opacity-50"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 16-1 5 5-1L21 8l-5-5L5 16Zm9-11 5 5M4 23h16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg></button>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="프로필 사진 파일" disabled={!!editor.pending} className="hidden" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void editor.changePhoto(file); }} />
        </div>
        {(editor.pending === 'photo' || editor.pending === 'reset') && <p role="status" className="mt-[8px] text-12 text-gray-m-500">{editor.pending === 'photo' ? '사진을 저장하고 있어요.' : '기본 이미지로 변경하고 있어요.'}</p>}
        {!!editor.error && editor.errorKind !== 'nickname' && <p role="alert" className="mt-[12px] text-center text-12 text-error">{letterFailure(editor.error)}</p>}
        {editor.canRetryPhoto && <button type="button" disabled={!!editor.pending} onClick={() => void editor.retryPhoto()} className="min-h-[44px] text-12 underline">사진 저장 다시 시도</button>}
      </div>
      <div className="mt-[36px] space-y-[40px] px-page">
        <div><label htmlFor="profile-name" className="mb-[12px] block text-16">이름</label><Input id="profile-name" value={profile.data.name ?? ''} placeholder="이름" readOnly aria-describedby="profile-name-help" hints={[{ label: '2~20자', isActive: false }, { label: '중복 불가', isActive: false }, { label: '즉시 반영', isActive: false }]} /><p id="profile-name-help" className="sr-only">이름은 아이디와 별도 정보입니다. 이름 변경 기능은 아직 사용할 수 없습니다.</p></div>
        <NicknameForm key={profile.data.nickname} current={profile.data.nickname} />
      </div>
      {editor.pending === 'nickname' && <p role="status" className="mt-[12px] px-page text-12 text-gray-m-500">아이디를 저장하고 있어요.</p>}
      {editor.message && <p role="status" className="mt-[12px] px-page text-12 leading-[1.6] text-gray-m-500">{editor.message}</p>}
      {!!profile.error && <ProfileLoadState error={profile.error} reload={profile.reload} />}
    </> : <ProfileLoadState error={profile.error} reload={profile.reload} />}
    <AccountActions />
    {photoMenu && <ArchiveDialog title="프로필 사진" onClose={() => setPhotoMenu(false)}><div className="space-y-[12px]"><Button disabled={!!editor.pending} onClick={() => { setPhotoMenu(false); fileInput.current?.click(); }}>사진 변경</Button><Button variant="muted" disabled={!profile.data?.profileImageUrl || !!editor.pending} onClick={() => { setPhotoMenu(false); setResetConfirm(true); }}>기본 이미지로 변경</Button><p className="text-12 text-gray-m-500">JPG·PNG·WebP, 최대 5MB</p></div></ArchiveDialog>}
    <Popup isOpen={resetConfirm} title="기본 이미지로 변경할까요?" description="현재 프로필 사진이 기본 이미지로 변경됩니다." confirmLabel="변경하기" onCancel={() => setResetConfirm(false)} onConfirm={() => { setResetConfirm(false); void editor.resetPhoto(); }} />
  </MypageShell>;
};
