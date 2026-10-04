import type { HttpClient } from '../../shared/http/HttpClient';
import type { AuthTokens } from '../../shared/storage/TokenStore';
import type { AuthRepository } from '../application/AuthRepository';

const LOGIN_PATH = '/api/auth/login';
const LOGOUT_PATH = '/api/mypage/account/logout';

/** AuthRepository 를 백엔드 HTTP API 로 구현 */
export const createHttpAuthRepository = (http: HttpClient): AuthRepository => ({
  // 로그인 요청에는 토큰을 붙이지 않는다 (실패해도 재발급 시도하지 않음)
  login: (credentials) => http.post<AuthTokens>(LOGIN_PATH, credentials, { auth: false }),

  logout: async (refreshToken) => {
    await http.post<void>(LOGOUT_PATH, { refreshToken });
  },
});
