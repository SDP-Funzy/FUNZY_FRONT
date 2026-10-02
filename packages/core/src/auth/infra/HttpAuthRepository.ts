import type { HttpClient } from '../../shared/http/HttpClient';
import type { AuthRepository } from '../application/AuthRepository';

const LOGOUT_PATH = '/api/mypage/account/logout';

/** AuthRepository 를 백엔드 HTTP API 로 구현 */
export const createHttpAuthRepository = (http: HttpClient): AuthRepository => ({
  logout: async (refreshToken) => {
    await http.post<void>(LOGOUT_PATH, { refreshToken });
  },
});
