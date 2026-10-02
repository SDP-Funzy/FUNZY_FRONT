import type { TokenStore } from '../../shared/storage/TokenStore';
import type { AuthRepository } from './AuthRepository';

type LogoutDeps = {
  authRepository: AuthRepository;
  tokenStore: TokenStore;
};

/**
 * 로그아웃
 * 서버에 이 기기의 세션 종료를 요청하고 저장된 토큰을 지운다.
 * 서버 요청이 실패해도(네트워크 끊김 등) 이 기기에서는 반드시 로그아웃되게 한다.
 */
export const makeLogout =
  ({ authRepository, tokenStore }: LogoutDeps) =>
  async () => {
    const refreshToken = await tokenStore.getRefreshToken();
    try {
      if (refreshToken) await authRepository.logout(refreshToken);
    } catch {
      // 서버 세션은 refresh token 만료 시 자연히 끝나므로, 기기 쪽 로그아웃을 우선한다
    } finally {
      await tokenStore.clear();
    }
  };
