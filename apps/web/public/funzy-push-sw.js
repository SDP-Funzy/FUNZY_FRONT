/* global self, indexedDB */
const state = (value) => new Promise((resolve, reject) => {
  const open = indexedDB.open('funzy-push', 1);
  open.onupgradeneeded = () => { open.result.createObjectStore('settings'); };
  open.onerror = () => reject(open.error);
  open.onsuccess = () => {
    const db = open.result;
    const transaction = db.transaction('settings', value === undefined ? 'readonly' : 'readwrite');
    const store = transaction.objectStore('settings');
    const request = value === undefined ? store.get('active') : store.put(value, 'active');
    transaction.oncomplete = () => { db.close(); resolve(value === undefined ? request.result === true : true); };
    transaction.onerror = transaction.onabort = () => { db.close(); reject(transaction.error); };
  };
});
const id = value => Number.isSafeInteger(value) && value > 0;
const target = data => {
  if (id(data.letterId)) return `/letterbox/${data.letterId}${data.type === 'GIFT_SELECTED' ? '/gifts/result' : ''}`;
  if (id(data.archiveCardId)) return `/archive/cards/${data.archiveCardId}?comments=1`;
  if (['FOLLOW_REQUEST', 'FOLLOW_ACCEPTED'].includes(data.type) && id(data.actorMemberId)) return `/friends/${data.actorMemberId}`;
  return '/notifications';
};
self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('message', event => {
  if (event.data?.type !== 'FUNZY_PUSH_STATUS' || typeof event.data.active !== 'boolean') return;
  event.waitUntil(state(event.data.active).then(() => event.ports[0]?.postMessage({ ok: true })).catch(() => event.ports[0]?.postMessage({ ok: false })));
});
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    if (!await state().catch(() => false)) return;
    let data;
    try { data = event.data?.json(); } catch { data = null; }
    if (!data || typeof data !== 'object') data = {};
    await self.registration.showNotification('Funzy', {
      body: typeof data.body === 'string' ? data.body : '새로운 알림이 도착했어요.',
      tag: id(data.notificationId) ? `funzy-${data.notificationId}` : undefined,
      data: { path: target(data), notificationId: id(data.notificationId) ? data.notificationId : null },
    });
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    if (!await state().catch(() => false)) return;
    const path = event.notification.data?.path;
    const safe = typeof path === 'string' && /^\/(?:notifications|letterbox\/\d+(?:\/gifts\/result)?|archive\/cards\/\d+\?comments=1|friends\/\d+)$/.test(path) ? path : '/notifications';
    const destination = new URL(safe, self.location.origin);
    if (id(event.notification.data?.notificationId)) destination.searchParams.set('notificationId', String(event.notification.data.notificationId));
    const url = destination.href;
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = clients.find(item => new URL(item.url).origin === self.location.origin);
    if (client) { await client.navigate(url); await client.focus(); }
    else await self.clients.openWindow(url);
  })());
});
