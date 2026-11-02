'use client';

import Image from 'next/image';
import { useState } from 'react';

import type { PreviewConnection } from '@/components/mypage/MypagePreviewProvider';
import { MypageShell } from '@/components/mypage/MypageShell';
import { Popup } from '@/components/ui/Popup';
import { useMypagePreview } from '@/hooks/mypage/useMypagePreview';

const PROVIDERS: { id: PreviewConnection; label: string; icon: string }[] = [
  { id: 'google', label: '구글', icon: '/icons/social-google.svg' },
  { id: 'naver', label: '네이버', icon: '/icons/social-naver.svg' },
  { id: 'kakao', label: '카카오', icon: '/icons/social-kakao.svg' },
];

export const ConnectedAccountsScreen = () => {
  const { connections, setConnections } = useMypagePreview();
  const [selected, setSelected] = useState<PreviewConnection | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const provider = PROVIDERS.find(item => item.id === selected);
  const connected = selected ? connections[selected] : false;
  return (
    <MypageShell title="연결 계정">
      <div className="mt-[40px] px-page">
        {PROVIDERS.map(item => <div key={item.id} className="flex min-h-[76px] items-center gap-[16px] border-b border-gray-m-100 py-[16px]">
          <Image src={item.icon} alt="" width={28} height={28} />
          <div className="flex-1"><p className="text-16">{item.label}</p><p className="mt-[4px] text-12 text-gray-m-400">{connections[item.id] ? '연결됨' : '연결 안 됨'}</p></div>
          <button type="button" onClick={() => setSelected(item.id)} aria-label={`${item.label} 계정 ${connections[item.id] ? '연결 해제' : '연결하기'}`}
            className="rounded-control border border-gray-m-100 px-[12px] py-[8px] text-14 focus-visible:outline-2 focus-visible:outline-orange">{connections[item.id] ? '연결 해제' : '연결하기'}</button>
        </div>)}
        {notice && <p role="status" className="mt-[20px] text-12 text-gray-m-500">{notice}</p>}
      </div>
      <Popup isOpen={selected !== null} title={`${provider?.label ?? ''} 계정 ${connected ? '연결 해제' : '연결'}`}
        description="실제 소셜 계정 연결은 아직 지원하지 않아요."
        cancelLabel="취소" confirmLabel={connected ? '연결 해제' : '연결하기'} onCancel={() => setSelected(null)}
        onConfirm={() => {
          if (selected) { setConnections(current => ({ ...current, [selected]: !current[selected] })); setNotice('연결 상태를 반영했어요.'); }
          setSelected(null);
        }} />
    </MypageShell>
  );
};
