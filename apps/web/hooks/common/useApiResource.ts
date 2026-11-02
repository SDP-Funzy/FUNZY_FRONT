'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

type ResourceState<T> = { key: string; data: T | null; loading: boolean; error: unknown };
export const createApiResource = <T,>() => {
  let state: ResourceState<T> = { key: '', data: null, loading: false, error: null };
  let generation = 0;
  let controller: AbortController | null = null;
  const listeners = new Set<() => void>();
  const publish = (next: ResourceState<T>) => { state = next; listeners.forEach(listener => listener()); };
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    cancel: () => { generation++; controller?.abort(); controller = null; },
    replace: (key: string, data: T) => { generation++; controller?.abort(); publish({ key, data, loading: false, error: null }); },
    load: async (key: string, loader: (signal: AbortSignal) => Promise<T>) => {
      const request = ++generation; controller?.abort(); controller = new AbortController(); const signal = controller.signal;
      publish({ key, data: state.key === key ? state.data : null, loading: true, error: null });
      try { const data = await loader(signal); if (request === generation && !signal.aborted) publish({ key, data, loading: false, error: null }); }
      catch (error) { if (request === generation && !signal.aborted) publish({ ...state, loading: false, error }); }
    },
  };
};
export const useApiResource = <T,>(key: string, loader: (signal: AbortSignal) => Promise<T>, enabled = true) => {
  const [store] = useState(() => createApiResource<T>());
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => {
    if (enabled) void store.load(key, loader);
    return store.cancel;
  }, [store, key, loader, enabled]);
  const state = enabled && snapshot.key === key ? snapshot : { key, data: null, loading: enabled, error: null };
  return { ...state, reload: () => store.load(key, loader), replace: (data: T) => store.replace(key, data) };
};
