'use client';

import { formatNotificationTime, getNotificationLabel, getNotificationTarget } from '@sdp/core';
import type { NotificationItem } from '@sdp/core';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Popup } from '@/components/ui/Popup';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';

const TARGET_LABELS = { letter: '편지', archive: '아카이브', friend: '친구' };

const EnvelopeIcon = () => (
  <svg width="22" height="18" viewBox="0 0 24 20" fill="none" aria-hidden="true" className="shrink-0">
    <path d="m1 8 11-7 11 7v11H1V8Z" fill="#e75d24" />
    <path d="m1 8 11 6 11-6M1 19l8-7m14 7-8-7" stroke="#bd4a1b" strokeWidth=".7" strokeLinejoin="round" />
  </svg>
);

export const NotificationsScreen = () => {
  const { items, loading, loaded, error, pendingIds, readErrors, store } = useNotifications();
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { void store.load(); }, [store]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const openItem = async (item: NotificationItem) => {
    if (!(await store.markRead(item.id))) return;
    const target = getNotificationTarget(item);
    if (target) setNotice(`${TARGET_LABELS[target.kind]} 화면은 준비 중이에요.`);
  };
  const refresh = () => { void store.load(); void store.refreshUnread(); };

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <Header title="알림" className="bg-cream" paddingClassName="pr-[24px] pl-[20px]"
        left={<Link href={ROUTES.home} aria-label="홈으로 돌아가기" className="flex size-[44px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange"><Image src="/icons/chevron-left.svg" alt="" width={14} height={21} /></Link>}
        right={<button type="button" disabled={loading} onClick={refresh} className="text-12 text-gray-m-500 disabled:opacity-40">새로고침</button>} />
      <section aria-label="알림 목록" aria-busy={loading} className="mt-[48px] flex flex-1 flex-col pb-safe">
        {(!loaded && !error) && <p role="status" className="px-page py-[40px] text-center text-14 text-gray-m-500">알림을 불러오고 있어요.</p>}
        {error && (
          <div role="alert" className="flex flex-col items-center gap-[16px] px-page py-[24px]">
            <p className="text-14 text-error">{error.message}</p>
            <Button fullWidth={false} disabled={loading} onClick={refresh} className="w-[140px]">다시 시도</Button>
          </div>
        )}
        {loaded && !error && items.length === 0 && <div role="status" className="flex flex-1 flex-col items-center justify-center gap-[12px] px-page pb-[60px]">
          <p className="text-18 font-semibold">아직 알림이 없어요</p>
          <p className="text-14 text-gray-m-500">새로운 소식이 도착하면 여기에서 알려드릴게요.</p>
        </div>}
        <ol>
          {items.map(item => {
            const busy = pendingIds.includes(item.id);
            const label = getNotificationLabel(item.type);
            const time = formatNotificationTime(item.createdAt, now);
            const readError = readErrors[item.id];
            return (
              <li key={item.id}>
                <button type="button" disabled={busy} onClick={() => { void openItem(item); }}
                  aria-label={`${item.read ? '읽은 알림' : '새 알림'}, ${label}, ${item.content}, ${time}`}
                  aria-describedby={readError ? `notification-error-${item.id}` : undefined}
                  className={cn('block w-full px-[24px] py-[16px] text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange disabled:cursor-wait', !item.read && 'bg-[#f8e4d6]')}>
                  <div className="flex items-center gap-[12px] text-14 text-gray-m-500">
                    <EnvelopeIcon /><span>{label}</span>
                    <time dateTime={Number.isFinite(Date.parse(item.createdAt)) ? item.createdAt : undefined} className="ml-auto shrink-0">{time}</time>
                  </div>
                  <p className="mt-[12px] pl-[34px] text-16 leading-[1.65] break-words whitespace-pre-line text-black">{item.content}</p>
                  {busy && <span className="sr-only">읽음 처리 중</span>}
                </button>
                {readError && <p id={`notification-error-${item.id}`} role="alert" className="px-[24px] pb-[12px] text-12 text-error">{readError.message} 알림을 눌러 다시 시도해 주세요.</p>}
              </li>
            );
          })}
        </ol>
      </section>
      <Popup isOpen={notice !== null} title="알림을 확인했어요" description={notice ?? undefined} showCancel={false}
        onCancel={() => setNotice(null)} onConfirm={() => setNotice(null)} />
    </div>
  );
};
