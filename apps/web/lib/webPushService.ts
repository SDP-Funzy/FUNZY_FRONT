import { createHttpWebPushRepository, createWebPushController } from '@sdp/core';
import type { BrowserPushSubscription, PushBrowser } from '@sdp/core';
import { apiClient } from '@/lib/apiClient';

const SCRIPT = '/funzy-push-sw.js';
const keyBytes = (key: string) => {
  const raw = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(raw, char => char.charCodeAt(0));
  if (bytes.length !== 65 || bytes[0] !== 4) throw new Error('Invalid push key');
  return bytes;
};
const keyString = (key: ArrayBuffer | null) => key ? btoa(String.fromCharCode(...new Uint8Array(key))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : null;
const wrap = (subscription: PushSubscription): BrowserPushSubscription => ({
  endpoint: subscription.endpoint,
  key: () => keyString(subscription.options.applicationServerKey),
  unsubscribe: () => subscription.unsubscribe(),
  data: () => {
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('Invalid push subscription');
    return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } };
  },
});
const ownRegistration = async () => {
  const registration = await navigator.serviceWorker.getRegistration('/');
  const worker = registration?.active ?? registration?.waiting ?? registration?.installing;
  return worker && new URL(worker.scriptURL).pathname === SCRIPT ? registration : undefined;
};
const registration = async () => {
  const result = await navigator.serviceWorker.register(SCRIPT, { scope: '/', updateViaCache: 'none' });
  if (result.active) return result;
  const worker = result.installing ?? result.waiting;
  if (!worker) throw new Error('Missing push worker');
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); worker.removeEventListener('statechange', changed); };
    const changed = () => {
      if (worker.state === 'activated') { cleanup(); resolve(); }
      else if (worker.state === 'redundant') { cleanup(); reject(new Error('Push worker stopped')); }
    };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Push worker timeout')); }, 8000);
    worker.addEventListener('statechange', changed); changed();
  });
  return result;
};
const browser: PushBrowser = {
  supported: () => typeof window !== 'undefined' && window.isSecureContext && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window,
  permission: () => typeof Notification === 'undefined' ? 'default' : Notification.permission,
  requestPermission: () => Notification.requestPermission(),
  subscription: async create => {
    const worker = create ? await registration() : await ownRegistration();
    const subscription = await worker?.pushManager.getSubscription();
    return subscription ? wrap(subscription) : null;
  },
  subscribe: async publicKey => wrap(await (await registration()).pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) })),
  active: async active => {
    const worker = (await ownRegistration())?.active;
    if (!worker) { if (active) throw new Error('Missing push worker'); return; }
    await new Promise<void>((resolve, reject) => {
      const channel = new MessageChannel();
      const cleanup = () => { clearTimeout(timer); channel.port1.close(); };
      const timer = setTimeout(() => { cleanup(); reject(new Error('Push state timeout')); }, 4000);
      channel.port1.onmessage = event => { cleanup(); if (event.data?.ok) resolve(); else reject(new Error('Push state failed')); };
      worker.postMessage({ type: 'FUNZY_PUSH_STATUS', active }, [channel.port2]);
    });
  },
  clearNotifications: async () => { const worker = await ownRegistration(); const notifications = await worker?.getNotifications(); notifications?.forEach(item => item.close()); },
};
export const webPush = createWebPushController(createHttpWebPushRepository(apiClient), browser);
