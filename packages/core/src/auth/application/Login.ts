import type { TokenStore } from '../../shared/storage/TokenStore';
import type { AuthRepository, LoginCredentials } from './AuthRepository';

type LoginDeps = {
  authRepository: AuthRepository;
  tokenStore: TokenStore;
};

/** 실패 사유 (서버 에러 코드) */
export const LOGIN_ERROR_CODES = {
  /** 아이디 없음 / 비밀번호 불일치 / 소셜 전용 계정 (계정 존재 여부를 숨기려고 모두 같은 코드) */
  invalidCredentials: 'AUTH_001',
  /** 실패가 많아 15분간 잠김 */
  locked: 'AUTH_010',
} as const;

/**
 * 아이디 로그인
 * 성공하면 토큰을 저장한다. 실패하면 ApiError 를 그대로 던지므로 화면에서 code 로 구분한다.
 */
export const makeLogin =
  ({ authRepository, tokenStore }: LoginDeps) =>
  async ({ nickname, password }: LoginCredentials) => {
    const tokens = await authRepository.login({ nickname: nickname.trim(), password });
    await tokenStore.setTokens(tokens);
  };
