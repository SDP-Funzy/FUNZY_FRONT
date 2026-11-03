'use client';

import Image from 'next/image';
import Link from 'next/link';

import { AccountActions } from '@/components/mypage/AccountActions';
import { MypageShell } from '@/components/mypage/MypageShell';
import { ProfileAvatar } from '@/components/mypage/ProfileAvatar';
import { useMypageApi } from '@/components/mypage/MypageApiProvider';
import { ProfileLoadState } from '@/components/mypage/ProfileLoadState';
import { letterImageUrl } from '@/lib/letterService';
import { ROUTES } from '@/lib/routes';
import { version } from '@/package.json';

export const MypageScreen = () => {
  const { profile, connected } = useMypageApi();
  const rows = [
    ...(connected.data?.hasPassword ? [{ label: '비밀번호 변경', href: ROUTES.mypagePassword }] : []),
    { label: '연결 계정', href: ROUTES.mypageConnections },
    { label: '알림 설정', href: ROUTES.mypageNotifications },
    { label: '약관 및 정책', href: ROUTES.mypagePolicies },
  ];
  return (
    <MypageShell title="프로필" home>
      {profile.data ? <div className="flex items-center gap-[16px] px-page pt-[24px]">
        <ProfileAvatar src={letterImageUrl(profile.data.profileImageUrl) ?? null} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-18 font-bold">{profile.data.name || profile.data.nickname}</p>
          {profile.data.email && <p className="mt-[3px] truncate text-14">{profile.data.email}</p>}
        </div>
        <Link href={ROUTES.mypageProfile} aria-label="프로필 정보" className="flex size-[44px] shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m10 2 4 0 1 3 3 1 3 3-2 3 2 3-3 3-3 1-1 3h-4l-1-3-3-1-3-3 2-3-2-3 3-3 3-1 1-3Z" fill="currentColor" transform="translate(0 -1) scale(1 .96)" />
            <circle cx="12" cy="12" r="3.5" fill="#fffcf8" />
          </svg>
        </Link>
      </div> : <ProfileLoadState error={profile.error} reload={profile.reload} />}
      {!!connected.error && <div className="px-page pt-[16px] text-12 text-error"><p role="alert">계정 정보를 불러오지 못했어요.</p><button type="button" onClick={connected.reload} className="min-h-[36px] underline">다시 불러오기</button></div>}
      <nav aria-label="프로필 설정" className="mt-[24px] px-[24px]">
        {rows.map(row => <Link key={row.href} href={row.href} className="flex min-h-[67px] items-center justify-between gap-[12px] border-b border-gray-m-100 px-[10px] py-[16px] text-16 focus-visible:outline-2 focus-visible:outline-orange">
          {row.label}<span className="flex h-[15px] w-[10px] shrink-0 items-center justify-center"><Image src="/icons/chevron-left.svg" alt="" width={14} height={21} className="shrink-0 -scale-x-[0.7] scale-y-[0.7] brightness-0" /></span>
        </Link>)}
        <div className="flex min-h-[67px] items-center justify-between px-[10px] py-[16px] text-16"><span>앱 버전</span><span className="text-gray-m-400">{version}</span></div>
      </nav>
      <AccountActions />
    </MypageShell>
  );
};
