import type { HttpClient } from '../../shared/http/HttpClient';
import type { SignupRepository } from '../application/SignupRepository';

/** 회원가입 API는 기존 로그인 세션과 무관하게 호출한다. */
export const createHttpSignupRepository = (http: HttpClient): SignupRepository => ({
  sendEmailCode: async (email) => {
    await http.post('/api/auth/email/code', { email }, { auth: false });
  },
  verifyEmailCode: (email, code) =>
    http.post('/api/auth/email/code/verify', { email, code }, { auth: false }),
  checkNickname: (nickname) =>
    http.get('/api/auth/nickname/check', { query: { nickname }, auth: false }),
  signup: async (input) => {
    await http.post('/api/auth/signup', input, { auth: false });
  },
});
