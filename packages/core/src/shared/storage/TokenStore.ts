import type { KeyValueStorage } from './KeyValueStorage';

const ACCESS_TOKEN_KEY = 'funzy.accessToken';
const REFRESH_TOKEN_KEY = 'funzy.refreshToken';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type TokenStore = ReturnType<typeof createTokenStore>;

/** access / refresh 토큰 저장소. 실제 저장 위치는 넘겨받은 storage 가 정한다 */
export const createTokenStore = (storage: KeyValueStorage) => ({
  getAccessToken: () => storage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => storage.getItem(REFRESH_TOKEN_KEY),

  setTokens: async ({ accessToken, refreshToken }: AuthTokens) => {
    await storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  setAccessToken: (accessToken: string) => storage.setItem(ACCESS_TOKEN_KEY, accessToken),

  clear: async () => {
    await storage.removeItem(ACCESS_TOKEN_KEY);
    await storage.removeItem(REFRESH_TOKEN_KEY);
  },
});
