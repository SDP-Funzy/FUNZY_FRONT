'use client';

import { useRef, useState } from 'react';
import { AccountActions } from '@/components/mypage/AccountActions';
import { MypageShell } from '@/components/mypage/MypageShell';
import { ProfileAvatar } from '@/components/mypage/ProfileAvatar';
import { Input } from '@/components/ui/Input';
import { useMypagePreview } from '@/hooks/mypage/useMypagePreview';

const ID_PATTERN = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9._]{2,20}$/;

export const ProfileEditScreen = () => {
  const { profile, setProfile, photo, photoPending, photoError, selectPhoto, resetPhoto } = useMypagePreview();
  const [name, setName] = useState(profile.name);
  const [loginId, setLoginId] = useState(profile.loginId);
  const [notice, setNotice] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const nameValid = name.trim().length >= 2 && name.trim().length <= 20;
  const idValid = ID_PATTERN.test(loginId);
  return (
    <MypageShell title="프로필">
      <div className="mx-auto mt-[32px] flex flex-col items-center">
        <div className="relative">
          <ProfileAvatar src={photo} large />
          <button type="button" aria-label="프로필 사진 선택" disabled={photoPending} onClick={() => input.current?.click()}
            className="absolute right-0 bottom-0 flex size-[36px] items-center justify-center rounded-full border-2 border-cream bg-black text-white focus-visible:outline-2 focus-visible:outline-orange disabled:opacity-50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 16-1 5 5-1L21 8l-5-5L5 16Zm9-11 5 5M4 23h16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
          </button>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="프로필 사진 파일" className="hidden"
            onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void selectPhoto(file); }} />
        </div>
        <button type="button" onClick={resetPhoto} disabled={!photo && !photoPending} className="mt-[12px] text-12 text-gray-m-500 underline disabled:opacity-40">기본 이미지로 변경</button>
        {photoPending && <p role="status" className="mt-[8px] text-12 text-gray-m-500">사진을 확인하고 있어요.</p>}
      </div>
      <div className="mt-[32px] flex flex-col gap-[36px] px-page">
        {photoError && <p role="alert" className="text-12 text-error">{photoError}</p>}
        <div>
          <label htmlFor="profile-name" className="mb-[12px] block text-16">이름</label>
          <Input id="profile-name" value={name} maxLength={20} isError={!nameValid} onClear={() => { setName(''); setNotice(null); }}
            onChange={(event) => { setName(event.target.value); setNotice(null); }} onBlur={() => { if (nameValid) { setProfile(current => ({ ...current, name: name.trim() })); setNotice('이름을 미리보기에 반영했어요.'); } }}
            hints={[{ label: '2~20자', isActive: nameValid }, { label: '중복 불가', isActive: false }, { label: '즉시 반영', isActive: nameValid && name.trim() === profile.name }]} />
          <p className="mt-[8px] text-12 text-gray-m-400">이름 중복 확인은 준비 중이에요.</p>
        </div>
        <div>
          <label htmlFor="profile-id" className="mb-[12px] block text-16">아이디</label>
          <Input id="profile-id" value={loginId} maxLength={20} autoCapitalize="none" spellCheck={false} isError={!idValid}
            onClear={() => { setLoginId(''); setNotice(null); }} onChange={(event) => { setLoginId(event.target.value.toLowerCase()); setNotice(null); }}
            onBlur={() => { if (idValid) { setProfile(current => ({ ...current, loginId })); setNotice('아이디를 미리보기에 반영했어요.'); } }} />
          <p className={`mt-[8px] text-12 ${idValid ? 'text-gray-m-400' : 'text-error'}`}>영문 소문자·숫자·마침표·밑줄로 2~20자 입력해 주세요.</p>
        </div>
        {notice && <p role="status" className="text-12 text-gray-m-500">{notice}</p>}
      </div>
      <AccountActions />
    </MypageShell>
  );
};
