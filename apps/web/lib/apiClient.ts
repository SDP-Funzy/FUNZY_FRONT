import { createHttpClient, createTokenStore } from '@sdp/core';

import { browserStorage } from '@/lib/browserStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL 이 없습니다. apps/web/.env.local 에 API 주소를 넣어주세요. (.env.example 참고)');
}

/** 웹에서 쓰는 토큰 저장소 (localStorage) */
export const tokenStore = createTokenStore(browserStorage);

/**
 * 웹에서 쓰는 API 클라이언트
 * core 의 저장소·유스케이스에 이걸 넘겨서 사용한다.
 */
export const apiClient = createHttpClient({
  baseUrl: API_BASE_URL,
  tokenStore,
  onSessionExpired: () => {
    // TODO: 로그인 화면이 생기면 이동 처리 (예: window.location.href = '/login')
  },
});
