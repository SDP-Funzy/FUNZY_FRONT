import type { HttpClient } from '../../shared/http/HttpClient';
import type { AccountRecoveryRepository } from '../application/AccountRecovery';

/** 복구 API는 로그인 토큰을 첨부하거나 토큰 재발급을 시도하지 않는다. */
export const createHttpAccountRecoveryRepository = (http: HttpClient): AccountRecoveryRepository => ({
  requestPasswordReset: async (email) => {
    await http.post('/api/auth/password/reset-request', { email }, { auth: false });
  },
  resetPassword: async (input) => {
    await http.post('/api/auth/password/reset', input, { auth: false });
  },
  requestAccountUnlock: async (email) => {
    await http.post('/api/auth/account/unlock-request', { email }, { auth: false });
  },
  unlockAccount: async (token) => {
    await http.post('/api/auth/account/unlock', { token }, { auth: false });
  },
});
