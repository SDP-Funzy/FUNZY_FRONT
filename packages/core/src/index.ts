// shared: 여러 도메인이 같이 쓰는 기반 (HTTP 통신, 저장소)
export { ApiError, isApiError, NETWORK_ERROR_CODE, UNKNOWN_ERROR_CODE } from './shared/http/ApiError';
export type { ApiResponse } from './shared/http/ApiResponse';
export { createHttpClient } from './shared/http/HttpClient';
export type { HttpClient, RequestOptions } from './shared/http/HttpClient';
export type { KeyValueStorage } from './shared/storage/KeyValueStorage';
export { createTokenStore } from './shared/storage/TokenStore';
export type { AuthTokens, TokenStore } from './shared/storage/TokenStore';

// auth: 로그인 상태, 로그아웃
export type { AuthRepository } from './auth/application/AuthRepository';
export { makeHasSession } from './auth/application/Session';
export { makeLogout } from './auth/application/Logout';
export { createHttpAuthRepository } from './auth/infra/HttpAuthRepository';
