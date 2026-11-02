'use client';

import { useContext, useSyncExternalStore } from 'react';

import { NotificationsContext } from '@/components/notifications/NotificationsProvider';

export const useNotifications = () => {
  const store = useContext(NotificationsContext);
  if (!store) throw new Error('useNotifications는 NotificationsProvider 안에서 사용해야 합니다.');
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...state, store };
};
