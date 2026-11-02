import type { ArchiveComment, ArchiveCommentPage } from './Archive';
import { isApiError } from '../shared/http/ApiError';

export const createArchiveCommentsStore = (fetchPage: (page: number) => Promise<ArchiveCommentPage>) => {
  let state = { items: [] as ArchiveComment[], loading: false, loaded: false, error: null as unknown, page: 0, last: true };
  let generation = 0;
  let lastMore = false;
  const listeners = new Set<() => void>();
  const publish = (changes: Partial<typeof state>) => { state = { ...state, ...changes }; listeners.forEach(listener => listener()); };
  const load = async (more = false) => {
    if (more && (state.loading || state.last)) return;
    lastMore = more;
    const request = ++generation;
    publish({ loading: true, error: null });
    try {
      const response = await fetchPage(more ? state.page + 1 : 0);
      if (request !== generation) return;
      const items = more ? [...state.items, ...response.comments] : response.comments;
      publish({ items: [...new Map(items.map(item => [item.commentId, item])).values()], page: response.page, last: response.last, loaded: true, loading: false, error: null });
    } catch (error) { if (request === generation) publish({ error, loading: false, ...(isApiError(error) && [401, 403, 404].includes(error.status) ? { items: [], loaded: false } : {}) }); }
  };
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    load: () => load(), more: () => load(true),
    retry: () => load(lastMore && state.loaded),
    cancel: () => { generation++; },
  };
};
