'use client';

import { MypageShell } from '@/components/mypage/MypageShell';
import { createPushSettingsStore } from '@sdp/core';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { accountSettingsRepository } from '@/lib/accountSettingsService';
import { letterFailure } from '@/lib/letterService';
import { cn } from '@/lib/cn';

export const NotificationSettingsScreen = () => {
  const [store] = useState(() => createPushSettingsStore(accountSettingsRepository));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => { void store.load(); return store.cancel; }, [store]);
  const rows = [
    { key: 'push', label: '푸시 알림 수신' }, { key: 'letter', label: '편지 수신 알림' },
    { key: 'reaction', label: '리액션 수신 알림' }, { key: 'comment', label: '댓글 수신 알림' },
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
        <p className="mt-[8px] text-12 leading-[1.6] text-gray-m-400">실제 푸시 알림 수신에는 브라우저 알림 권한과 구독이 필요해요. 이 설정을 꺼도 알림함에는 알림이 쌓여요.</p>
        {(state.loading || state.saving) && <p role="status" className="mt-[16px] text-12 text-gray-m-500">{state.saving ? '알림 설정을 저장하고 있어요.' : '알림 설정을 불러오고 있어요.'}</p>}
        {!!state.error && <div className="mt-[16px] text-12"><p role="alert" className="text-error">{letterFailure(state.error)}</p><button type="button" disabled={state.loading || state.saving} onClick={() => void store.load()} className="mt-[8px] min-h-[44px] underline">설정 다시 불러오기</button></div>}
      </div>
    </MypageShell>
  );
};
