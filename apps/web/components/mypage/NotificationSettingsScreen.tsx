'use client';

import { MypageShell } from '@/components/mypage/MypageShell';
import { useMypagePreview } from '@/hooks/mypage/useMypagePreview';
import type { PreviewNotifications } from '@/components/mypage/MypagePreviewProvider';
import { cn } from '@/lib/cn';

export const NotificationSettingsScreen = () => {
  const { notifications, setNotifications } = useMypagePreview();
  const rows: { key: keyof PreviewNotifications; label: string }[] = [
    { key: 'push', label: '푸시 알림 수신' }, { key: 'letter', label: '편지 수신 알림' },
    { key: 'reaction', label: '리액션 수신 알림' }, { key: 'comment', label: '댓글 수신 알림' },
  ];
  return (
    <MypageShell title="알림설정">
      <div className="mt-[48px] px-[24px]">
        {rows.map(row => {
          const disabled = row.key !== 'push' && !notifications.push;
          const checked = notifications[row.key] && !disabled;
          return <div key={row.key} className="flex min-h-[67px] items-center justify-between gap-[12px] border-b border-gray-m-100 px-[8px] py-[12px]">
            <span className="text-16">{row.label}</span>
            <button type="button" role="switch" aria-label={row.label} aria-checked={checked} disabled={disabled}
              aria-describedby={disabled ? 'push-settings-help' : undefined}
              onClick={() => setNotifications(current => ({ ...current, [row.key]: !current[row.key] }))}
              className={cn('relative h-[34px] w-[72px] shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:opacity-60', checked ? 'bg-orange' : 'bg-gray-m-100')}>
              <span aria-hidden="true" className={cn('absolute top-1/2 -translate-y-1/2 text-14', checked ? 'left-[10px] text-gray-m-600' : 'right-[8px] text-gray-m-300')}>{checked ? 'ON' : 'OFF'}</span>
              <span aria-hidden="true" className={cn('absolute top-[3px] size-[28px] rounded-full bg-white transition-all motion-reduce:transition-none', checked ? 'left-[41px]' : 'left-[3px]')} />
            </button>
          </div>;
        })}
        {!notifications.push && <p id="push-settings-help" className="mt-[16px] text-12 text-gray-m-500">푸시 알림 수신을 켜면 세부 알림을 설정할 수 있어요.</p>}
      </div>
    </MypageShell>
  );
};
