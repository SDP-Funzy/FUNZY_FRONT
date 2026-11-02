import type { LetterRepository, ReceivedLetter, ReceivedLetterQuery } from './Letter';

export type ReceivedLettersState = { key: string; items: ReceivedLetter[]; loaded: boolean; loading: boolean; loadingMore: boolean; error: unknown; page: number; last: boolean; total: number };
export const createReceivedLettersStore = (repo: Pick<LetterRepository, 'received'>) => {
  let state: ReceivedLettersState = { key: '', items: [], loaded: false, loading: false, loadingMore: false, error: null, page: 0, last: true, total: 0 };
  let query: ReceivedLetterQuery = {};
  let generation = 0;
  const listeners = new Set<() => void>();
  const publish = (changes: Partial<ReceivedLettersState>) => { state = { ...state, ...changes }; listeners.forEach(listener => listener()); };
  const loadPage = async (next: ReceivedLetterQuery, more: boolean) => {
    const request = ++generation;
    const key = JSON.stringify(next);
    if (!more) { query = next; publish({ key, items: [], loaded: false, loading: true, loadingMore: false, error: null }); }
    else publish({ loadingMore: true, error: null });
    const page = more ? state.page + 1 : 0;
    try {
      const result = await repo.received({ ...next, page, size: 20 });
      if (request !== generation) return;
      const previous = more ? state.items : [];
      const merged = [...previous, ...result.letters];
      publish({ key, items: [...new Map(merged.map(letter => [letter.letterId, letter])).values()], page: result.page, last: result.last, total: result.totalElements, loaded: true, loading: false, loadingMore: false, error: null });
    } catch (error) { if (request === generation) publish({ error, loading: false, loadingMore: false }); }
  };
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    cancel: () => { generation++; },
    load: (next: ReceivedLetterQuery, force = false) => state.loaded && state.key === JSON.stringify(next) && !force ? Promise.resolve() : loadPage(next, false),
    reload: () => loadPage(query, false),
    more: () => state.loading || state.loadingMore || state.last ? Promise.resolve() : loadPage(query, true),
    markRead: (id: number) => { if (state.items.some(item => item.letterId === id && !item.read)) publish({ items: state.items.map(item => item.letterId === id ? { ...item, read: true } : item) }); },
  };
};
