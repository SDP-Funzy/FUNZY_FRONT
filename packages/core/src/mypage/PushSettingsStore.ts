import type { AccountSettingsRepository } from './AccountSettings';

export const createPushSettingsStore = (repo: Pick<AccountSettingsRepository, 'pushSetting' | 'updatePushSetting'>) => {
  let state = { enabled: null as boolean | null, loaded: false, loading: false, saving: false, error: null as unknown };
  let generation = 0;
  const listeners = new Set<() => void>();
  const publish = (changes: Partial<typeof state>) => { state = { ...state, ...changes }; listeners.forEach(listener => listener()); };
  const load = async () => {
    if (state.saving) return;
    const request = ++generation; publish({ loading: true, error: null });
    try { const data = await repo.pushSetting(); if (request === generation) publish({ enabled: data.pushNotificationEnabled, loaded: true, loading: false, error: null }); }
    catch (error) { if (request === generation) publish({ error, loading: false }); }
  };
  const set = async (enabled: boolean) => {
    if (!state.loaded || state.loading || state.saving || enabled === state.enabled) return false;
    const request = ++generation; publish({ saving: true, error: null });
    try { await repo.updatePushSetting(enabled); if (request !== generation) return false; publish({ enabled, saving: false, error: null }); return true; }
    catch (error) { if (request === generation) publish({ saving: false, error }); return false; }
  };
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    load, set, cancel: () => { generation++; },
  };
};
