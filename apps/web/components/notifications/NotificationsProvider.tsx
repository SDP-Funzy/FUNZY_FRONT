'use client';

import { createHttpNotificationRepository, createNotificationStore } from '@sdp/core';
import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '@/hooks/auth/useAuth';
import { apiClient } from '@/lib/apiClient';

export const NotificationsContext = createContext<ReturnType<typeof createNotificationStore> | null>(null);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { status } = useAuth();
  const [store] = useState(() => createNotificationStore(createHttpNotificationRepository(apiClient)));

  useEffect(() => {
    if (status === 'unauthenticated') { store.reset(); return; }
    if (status !== 'authenticated') return;
    const refresh = () => { void store.refreshUnread(); };
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, store]);

  return <NotificationsContext.Provider value={store}>{children}</NotificationsContext.Provider>;
};
