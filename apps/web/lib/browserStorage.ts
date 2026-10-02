import type { KeyValueStorage } from '@sdp/core';

/**
 * core 의 KeyValueStorage 를 브라우저 localStorage 로 구현
 * - 서버 렌더 중에는 window 가 없으므로 아무것도 하지 않는다
 * - 사생활 보호 모드 등에서 localStorage 가 막혀 있어도 앱이 죽지 않도록 try/catch
 */
export const browserStorage: KeyValueStorage = {
  getItem: async (key) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // 저장 실패 시 이번 세션에서만 로그인이 유지되지 않는 정도라 조용히 넘어간다
    }
  },
  removeItem: async (key) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // 위와 같음
    }
  },
};
