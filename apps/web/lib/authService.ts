import { createHttpAuthRepository, makeHasSession, makeLogin, makeLogout } from '@sdp/core';

import { apiClient, tokenStore } from '@/lib/apiClient';

/**
 * 웹에서 쓰는 인증 유스케이스 조립
 * core 의 유스케이스에 웹용 구현(HTTP 저장소, localStorage 토큰 저장소)을 넣어서 만든다.
 */
const authRepository = createHttpAuthRepository(apiClient);

export const hasSession = makeHasSession(tokenStore);
export const login = makeLogin({ authRepository, tokenStore });
export const logout = makeLogout({ authRepository, tokenStore });
