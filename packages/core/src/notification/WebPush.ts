import type { HttpClient } from '../shared/http/HttpClient';

export type PushSubscriptionData = { endpoint: string; keys: { p256dh: string; auth: string } };
export type WebPushRepository = {
  publicKey(): Promise<string | null>;
  subscribe(data: PushSubscriptionData): Promise<void>;
  unsubscribe(endpoint: string): Promise<void>;
};
const timed = async <T>(run: (signal: AbortSignal) => Promise<T>) => {
  const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), 8000);
  try { return await run(abort.signal); } finally { clearTimeout(timer); }
};
export const createHttpWebPushRepository = (http: HttpClient): WebPushRepository => ({
  publicKey: () => timed(async signal => {
    const data = await http.get<{ publicKey: string | null }>('/api/mypage/notifications/push/public-key', { signal });
    if (!data || (data.publicKey !== null && typeof data.publicKey !== 'string')) throw new Error('알림 서버 설정을 확인하지 못했어요.');
    return data.publicKey?.replace(/=+$/, '') ?? null;
  }),
  subscribe: data => timed(async signal => { await http.put('/api/mypage/notifications/push/subscriptions', data, { signal }); }),
  unsubscribe: endpoint => timed(async signal => { await http.delete('/api/mypage/notifications/push/subscriptions', { body: { endpoint }, signal }); }),
});

export type BrowserPushSubscription = { endpoint: string; data(): PushSubscriptionData; key(): string | null; unsubscribe(): Promise<boolean> };
export type PushBrowser = {
  supported(): boolean;
  permission(): NotificationPermission;
  requestPermission(): Promise<NotificationPermission>;
  subscription(register: boolean): Promise<BrowserPushSubscription | null>;
  subscribe(publicKey: string): Promise<BrowserPushSubscription>;
  active(value: boolean): Promise<void>;
  clearNotifications(): Promise<void>;
};
export type WebPushState = { supported: boolean; permission: NotificationPermission; subscribed: boolean; busy: boolean; serverEnabled: boolean | null; error: string | null };

export const createWebPushController = (repo: WebPushRepository, browser: PushBrowser) => {
  let state: WebPushState = { supported: false, permission: 'default', subscribed: false, busy: false, serverEnabled: null, error: null };
  const listeners = new Set<() => void>();
  const publish = (changes: Partial<WebPushState>) => { state = { ...state, ...changes }; listeners.forEach(listener => listener()); };
  let session = false; let generation = 0; let tail: Promise<void> = Promise.resolve();
  let connection: { generation: number; promise: Promise<void> } | null = null;
  const enqueue = (run: () => Promise<void>) => {
    const next = tail.catch(() => {}).then(run); tail = next; return next;
  };
  const refresh = () => publish({ supported: browser.supported(), permission: browser.permission() });
  const connect = async (request: number) => {
    const current = () => session && request === generation;
    if (!current()) return;
    const publicKey = await repo.publicKey();
    if (!current()) return;
    publish({ serverEnabled: publicKey !== null });
    if (!publicKey) { await browser.active(false); publish({ subscribed: false }); return; }
    let subscription = await browser.subscription(true);
    if (!current()) return;
    if (subscription && subscription.key() !== publicKey) {
      await repo.unsubscribe(subscription.endpoint);
      if (!await subscription.unsubscribe()) throw new Error('기존 브라우저 알림 연결을 해제하지 못했어요.');
      subscription = null;
    }
    let created = false;
    if (!subscription) { subscription = await browser.subscribe(publicKey); created = true; }
    if (!current()) { if (created) await subscription.unsubscribe(); return; }
    try {
      await repo.subscribe(subscription.data());
      if (!current()) return;
      await browser.active(true);
      if (current()) publish({ subscribed: true });
    } catch (error) {
      if (created) await subscription.unsubscribe().catch(() => false);
      await browser.active(false).catch(() => {});
      throw error;
    }
  };
  const runConnect = (request: number, permission?: Promise<NotificationPermission>) => {
    if (connection?.generation === request) return connection.promise;
    const promise = enqueue(async () => {
      if (!session || request !== generation) return;
      publish({ busy: true, error: null });
      try {
        if (permission) await permission;
        refresh();
        if (browser.permission() === 'granted' && session && request === generation) await connect(request);
      } catch {
        await browser.active(false).catch(() => {});
        if (request === generation) publish({ subscribed: false, error: '브라우저 알림 연결을 완료하지 못했어요. 다시 시도해 주세요.' });
      } finally { if (request === generation) { refresh(); publish({ busy: false }); } }
    });
    connection = { generation: request, promise };
    void promise.finally(() => { if (connection?.promise === promise) connection = null; });
    return promise;
  };
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    start: () => {
      session = true; refresh();
      if (!browser.supported() || browser.permission() !== 'granted') return Promise.resolve();
      return runConnect(generation);
    },
    enable: () => {
      refresh();
      if (!session || state.busy || !browser.supported() || browser.permission() === 'denied') return Promise.resolve();
      // 권한 요청은 비동기 대기 전에 클릭 이벤트 안에서 시작한다.
      const permission = browser.permission() === 'default' ? browser.requestPermission().catch(() => 'denied' as const) : undefined;
      publish({ busy: true, error: null });
      return runConnect(generation, permission);
    },
    stop: (notifyServer = false) => {
      session = false; const request = ++generation;
      publish({ subscribed: false, busy: true, error: null });
      return enqueue(async () => {
        try {
          if (!browser.supported()) return;
          let failed = false;
          await browser.active(false).catch(() => { failed = true; });
          await browser.clearNotifications().catch(() => { failed = true; });
          const subscription = await browser.subscription(false);
          if (subscription) {
            try { if (notifyServer) await repo.unsubscribe(subscription.endpoint); }
            finally { if (!await subscription.unsubscribe()) failed = true; }
          }
          if (failed) throw new Error('Push cleanup failed');
        } catch { if (request === generation) publish({ error: '브라우저 알림 연결 정리를 완료하지 못했어요. 다시 시도해 주세요.' }); }
        finally { if (request === generation) { refresh(); publish({ busy: false }); } }
      });
    },
  };
};
