import type { TokenStore } from '../../shared/storage/TokenStore';

/**
 * 로그인 상태인지 확인
 * access token 은 1시간이면 만료되지만 refresh token 으로 다시 발급받을 수 있으므로,
 * refresh token 이 있으면 로그인 상태로 본다. (refresh token 까지 무효면 첫 API 요청에서 세션 만료 처리됨)
 */
export const makeHasSession = (tokenStore: TokenStore) => async () => {
  const refreshToken = await tokenStore.getRefreshToken();
  return Boolean(refreshToken);
};
