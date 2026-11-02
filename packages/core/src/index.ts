// shared: 여러 도메인이 같이 쓰는 기반 (HTTP 통신, 저장소)
export { ApiError, isApiError, NETWORK_ERROR_CODE, UNKNOWN_ERROR_CODE } from './shared/http/ApiError';
export type { ApiResponse } from './shared/http/ApiResponse';
export { createHttpClient } from './shared/http/HttpClient';
export type { HttpClient, RequestOptions } from './shared/http/HttpClient';
export type { KeyValueStorage } from './shared/storage/KeyValueStorage';
export { createTokenStore } from './shared/storage/TokenStore';
export type { AuthTokens, TokenStore } from './shared/storage/TokenStore';

// auth: 로그인 상태, 로그아웃
export type { AuthRepository, LoginCredentials } from './auth/application/AuthRepository';
export { LOGIN_ERROR_CODES, makeLogin } from './auth/application/Login';
export { makeHasSession } from './auth/application/Session';
export { makeLogout } from './auth/application/Logout';
export { createHttpAuthRepository } from './auth/infra/HttpAuthRepository';
export type { SignupInput, SignupRepository } from './auth/application/SignupRepository';
export type { SignupDetails, SignupState } from './auth/application/Signup';
export { SIGNUP_ERROR_CODES, createSignupFlow } from './auth/application/Signup';
export { createHttpSignupRepository } from './auth/infra/HttpSignupRepository';

// heartCard: 마음카드 작성 규칙
export {
  HEART_CARD_CATEGORIES,
  MAX_HEART_CARDS_PER_LETTER,
  canAddHeartCard,
  createHeartCardDraft,
  isHeartCardWritten,
} from './heartCard/domain/HeartCard';
export type { HeartCardCategory, HeartCardDraft } from './heartCard/domain/HeartCard';

// auth: 비밀번호 재설정·계정 잠금 해제
export type { AccountRecoveryRepository, PasswordResetInput } from './auth/application/AccountRecovery';
export { makeAccountRecovery, RECOVERY_ERROR_CODES, recoveryNeedsNewLink } from './auth/application/AccountRecovery';
export { createHttpAccountRecoveryRepository } from './auth/infra/HttpAccountRecoveryRepository';
