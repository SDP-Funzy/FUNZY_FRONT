import { ApiError, isApiError, UNKNOWN_ERROR_CODE } from '../shared/http/ApiError';
import type { NotificationItem, NotificationRepository } from './Notification';

export type NotificationState = {
  items: NotificationItem[];
  loading: boolean;
  loaded: boolean;
  error: ApiError | null;
  unreadCount: number | null;
  pendingIds: number[];
  readErrors: Record<number, ApiError>;
};

const initial = (): NotificationState => ({ items: [], loading: false, loaded: false, error: null, unreadCount: null, pendingIds: [], readErrors: {} });
const asError = (cause: unknown) => isApiError(cause) ? cause : new ApiError(0, UNKNOWN_ERROR_CODE, '잠시 후 다시 시도해 주세요.');

/** 앱 인스턴스별 알림 상태. 로그아웃 이전 요청과 늦게 도착한 읽음 전 상태를 적용하지 않는다. */
export const createNotificationStore = (repository: NotificationRepository) => {
  let state = initial();
  let epoch = 0;
  let readRevision = 0;
  let countSequence = 0;
  let listPromise: Promise<void> | null = null;
  let countPending: { epoch: number; revision: number; promise: Promise<void> } | null = null;
  const reads = new Map<number, Promise<boolean>>();
  const readIds = new Set<number>();
  const listeners = new Set<() => void>();
  const update = (patch: Partial<NotificationState>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };

  const refreshUnread = (): Promise<void> => {
    if (countPending?.epoch === epoch && countPending.revision === readRevision) return countPending.promise;
    const requestEpoch = epoch;
    const requestRevision = readRevision;
    const sequence = ++countSequence;
    const promise = Promise.resolve().then(() => repository.unreadCount()).then(result => {
      if (requestEpoch === epoch && requestRevision === readRevision && sequence === countSequence && Number.isSafeInteger(result.unreadCount) && result.unreadCount >= 0) {
        update({ unreadCount: result.unreadCount });
      }
    }).catch(() => {
      // 뱃지 조회 실패로 화면 전체를 막거나 기존 개수를 0으로 바꾸지 않는다.
    }).finally(() => { if (countPending?.promise === promise) countPending = null; });
    countPending = { epoch: requestEpoch, revision: requestRevision, promise };
    return promise;
  };

  const load = (): Promise<void> => {
    if (listPromise) return listPromise;
    const requestEpoch = epoch;
    update({ loading: true, error: null });
    const promise = (async () => {
      try {
        const items = await Promise.resolve().then(() => repository.list());
        if (requestEpoch !== epoch) return;
        const unique = [...new Map(items.map(item => [item.id, item])).values()];
        unique.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
        update({ items: unique.map(item => readIds.has(item.id) ? { ...item, read: true } : item), loaded: true });
      } catch (cause) {
        if (requestEpoch === epoch) update({ error: asError(cause) });
      } finally {
        if (requestEpoch === epoch) { listPromise = null; update({ loading: false }); }
      }
    })();
    listPromise = promise;
    return promise;
  };

  const markRead = (id: number): Promise<boolean> => {
    const existing = reads.get(id);
    if (existing) return existing;
    const item = state.items.find(notification => notification.id === id);
    if (!item) return Promise.resolve(false);
    if (item.read) return Promise.resolve(true);
    const requestEpoch = epoch;
    const errors = { ...state.readErrors };
    delete errors[id];
    update({ pendingIds: [...state.pendingIds, id], readErrors: errors });
    const promise = (async () => {
      try {
        await Promise.resolve().then(() => repository.markRead(id));
        if (requestEpoch !== epoch) return false;
        readRevision++;
        readIds.add(id);
        update({ items: state.items.map(notification => notification.id === id ? { ...notification, read: true } : notification),
          unreadCount: state.unreadCount === null ? null : Math.max(0, state.unreadCount - 1) });
        void refreshUnread();
        return true;
      } catch (cause) {
        if (requestEpoch === epoch) update({ readErrors: { ...state.readErrors, [id]: asError(cause) } });
        return false;
      } finally {
        if (requestEpoch === epoch) {
          reads.delete(id);
          update({ pendingIds: state.pendingIds.filter(pending => pending !== id) });
        }
      }
    })();
    reads.set(id, promise);
    return promise;
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    load, markRead, refreshUnread,
    reset: () => {
      epoch++; readRevision = 0; countSequence++;
      listPromise = null; countPending = null; reads.clear(); readIds.clear();
      state = initial(); listeners.forEach(listener => listener());
    },
  };
};
