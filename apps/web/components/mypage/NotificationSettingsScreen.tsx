'use client';

import { MypageShell } from '@/components/mypage/MypageShell';
import { createPushSettingsStore } from '@sdp/core';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { accountSettingsRepository } from '@/lib/accountSettingsService';
import { letterFailure } from '@/lib/letterService';
import { cn } from '@/lib/cn';
import { webPush } from '@/lib/webPushService';

export const NotificationSettingsScreen = () => {
  const [store] = useState(() => createPushSettingsStore(accountSettingsRepository));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const push = useSyncExternalStore(webPush.subscribe, webPush.getSnapshot, webPush.getSnapshot);
  useEffect(() => { void store.load(); return store.cancel; }, [store]);
  const rows = [
    { key: 'push', label: '푸시 알림 수신' }, { key: 'letter', label: '편지 수신 알림' },
    { key: 'comment', label: '댓글 수신 알림' },
  ];
  return (
    <MypageShell title="알림설정">
      <div aria-busy={state.loading || state.saving} className="mt-[48px] px-[24px]">
        {rows.map(row => {
          const disabled = row.key !== 'push' || !state.loaded || state.loading || state.saving;
          const checked = state.enabled === true;
          return <div key={row.key} className="flex min-h-[67px] items-center justify-between gap-[12px] border-b border-gray-m-100 px-[8px] py-[12px]">
            <span className="text-16">{row.label}</span>
            <button type="button" role="switch" aria-label={row.label} aria-checked={checked} disabled={disabled}
              aria-describedby={row.key !== 'push' ? 'push-settings-help' : undefined}
              onClick={() => { if (row.key === 'push') void store.set(!checked); }}
              className={cn('relative h-[34px] w-[72px] shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:opacity-60', checked ? 'bg-orange' : 'bg-gray-m-100')}>
              <span aria-hidden="true" className={cn('absolute top-1/2 -translate-y-1/2 text-14', checked ? 'left-[10px] text-gray-m-600' : 'right-[8px] text-gray-m-300')}>{state.enabled === null ? '…' : checked ? 'ON' : 'OFF'}</span>
              <span aria-hidden="true" className={cn('absolute top-[3px] size-[28px] rounded-full bg-white transition-all motion-reduce:transition-none', checked ? 'left-[41px]' : 'left-[3px]')} />
            </button>
          </div>;
        })}
        <p id="push-settings-help" className="mt-[16px] text-12 leading-[1.6] text-gray-m-500">세부 항목은 전체 수신 설정을 따르며, 개별 변경은 준비 중이에요.</p>
        <p className="mt-[8px] text-12 leading-[1.6] text-gray-m-400">전체 수신 설정과 이 브라우저의 알림 연결이 모두 켜져 있어야 알림을 받을 수 있어요. 설정을 꺼도 알림함에는 알림이 쌓여요.</p>
        <section aria-label="이 브라우저 알림" className="mt-[24px] border-t border-gray-m-100 pt-[20px]">
          <p className="text-14 font-semibold">이 브라우저 알림</p>
          <p role="status" className="mt-[8px] text-12 leading-[1.6] text-gray-m-500">{push.busy ? '브라우저 알림 연결을 확인하고 있어요.' : !push.supported ? '이 환경에서는 브라우저 알림을 지원하지 않아요. iPhone은 Safari에서 홈 화면에 추가한 뒤 실행해 주세요.' : push.permission === 'denied' ? '알림 권한이 차단되어 있어요. 브라우저의 사이트 설정에서 알림을 허용한 뒤 다시 열어 주세요.' : push.serverEnabled === false ? '현재 푸시 알림을 사용할 수 없어요. 나중에 다시 시도해 주세요.' : push.subscribed ? '이 브라우저의 알림이 연결됐어요.' : '아래 버튼을 눌러 이 브라우저에서 알림을 받아 보세요.'}</p>
          {!push.subscribed && push.supported && push.permission !== 'denied' && <button type="button" disabled={push.busy} onClick={() => { void webPush.enable(); }} className="mt-[12px] min-h-[44px] rounded-control bg-black px-[16px] text-14 text-white disabled:opacity-40">{push.busy ? '연결 중...' : push.error || push.serverEnabled === false ? '알림 연결 다시 시도' : '이 브라우저에서 알림 받기'}</button>}
          {push.error && <p role="alert" className="mt-[12px] text-12 text-error">{push.error}</p>}
        </section>
        {(state.loading || state.saving) && <p role="status" className="mt-[16px] text-12 text-gray-m-500">{state.saving ? '알림 설정을 저장하고 있어요.' : '알림 설정을 불러오고 있어요.'}</p>}
        {!!state.error && <div className="mt-[16px] text-12"><p role="alert" className="text-error">{letterFailure(state.error)}</p><button type="button" disabled={state.loading || state.saving} onClick={() => void store.load()} className="mt-[8px] min-h-[44px] underline">설정 다시 불러오기</button></div>}
      </div>
    </MypageShell>
  );
};
