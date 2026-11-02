'use client';
import { AccountActions } from '@/components/mypage/AccountActions';
import { MypageShell } from '@/components/mypage/MypageShell';
import { ProfileAvatar } from '@/components/mypage/ProfileAvatar';
import { ProfileLoadState } from '@/components/mypage/ProfileLoadState';
import { useMypageApi } from '@/components/mypage/MypageApiProvider';
import { accountProviderLabel } from '@/lib/profileService';
import { letterImageUrl } from '@/lib/letterService';

export const ProfileEditScreen = () => {
  const { profile } = useMypageApi();
  return <MypageShell title="프로필">
    {profile.data ? <>
      <div className="mx-auto mt-[32px] flex flex-col items-center"><ProfileAvatar src={letterImageUrl(profile.data.profileImageUrl) ?? null} large /></div>
      <dl className="mt-[32px] flex flex-col gap-[32px] px-page">
        <div><dt className="mb-[12px] text-16">아이디</dt><dd className="rounded-control border border-gray-m-100 bg-white px-[20px] py-[16px] text-16 break-words">{profile.data.nickname}</dd></div>
        <div><dt className="mb-[12px] text-16">가입 방식</dt><dd className="rounded-control border border-gray-m-100 bg-white px-[20px] py-[16px] text-16">{accountProviderLabel[profile.data.provider]}</dd></div>
      </dl>
      <div className="px-page pt-[24px]"><p className="text-12 text-gray-m-400">프로필 편집은 준비 중이에요.</p><button type="button" disabled={profile.loading} onClick={profile.reload} className="mt-[12px] min-h-[44px] text-14 underline disabled:opacity-40">새로고침</button></div>
      {!!profile.error && <ProfileLoadState error={profile.error} reload={profile.reload} />}
    </> : <ProfileLoadState error={profile.error} reload={profile.reload} />}
    <AccountActions />
  </MypageShell>;
};
