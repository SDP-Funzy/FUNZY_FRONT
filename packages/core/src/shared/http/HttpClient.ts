import type { AuthTokens, TokenStore } from '../storage/TokenStore';
import { ApiError, NETWORK_ERROR_CODE, UNKNOWN_ERROR_CODE } from './ApiError';
import type { ApiResponse } from './ApiResponse';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type QueryValue = string | number | boolean | undefined;

export type RequestOptions = {
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** false 면 Authorization 헤더를 붙이지 않는다 (로그인, 회원가입 등). 기본 true */
  auth?: boolean;
};

type HttpClientConfig = {
  baseUrl: string;
  tokenStore: TokenStore;
  /** 토큰 재발급까지 실패해서 다시 로그인해야 할 때 (예: 로그인 화면으로 이동) */
  onSessionExpired?: () => void;
};

const TOKEN_REISSUE_PATH = '/api/auth/token/reissue';

/** access token 만료 응답 (재발급 후 다시 시도할 대상) */
const ACCESS_TOKEN_EXPIRED_CODE = 'AUTH_004';
const isAccessTokenExpired = (error: ApiError) => error.status === 401 && error.code === ACCESS_TOKEN_EXPIRED_CODE;

/**
 * 토큰 자체가 무효인 응답 (재발급으로도 살릴 수 없어 세션을 끝낸다)
 * AUTH_003: 유효하지 않은 토큰 / AUTH_005: 폐기된 세션 (로그아웃·비밀번호 변경·탈퇴, 교체된 토큰 재사용)
 */
const SESSION_INVALID_CODES = ['AUTH_003', 'AUTH_005'];
const isSessionInvalid = (error: ApiError) => error.status === 401 && SESSION_INVALID_CODES.includes(error.code);

/**
 * 재발급 요청에서 refresh token 자체가 거절된 응답 (= 세션을 끝내야 함)
 * 네트워크 오류(status 0), 5xx, 429 처럼 일시적인 실패는 여기에 해당하지 않는다
 */
const isRefreshRejected = (error: ApiError) => error.status === 400 || error.status === 401 || error.status === 403;

const buildUrl = (baseUrl: string, path: string, query?: Record<string, QueryValue>) => {
  const url = new URL(path, baseUrl);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

/** 공통 응답 형식을 풀어서 data 만 돌려주고, 실패면 ApiError 를 던진다 */
const parseResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text) {
    if (response.ok) return undefined as T;
    throw new ApiError(response.status, UNKNOWN_ERROR_CODE, '요청을 처리하지 못했어요.');
  }

  let body: ApiResponse<T>;
  try {
    body = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new ApiError(response.status, UNKNOWN_ERROR_CODE, '서버 응답을 읽지 못했어요.');
  }

  if (!response.ok || !body.success) {
    throw new ApiError(response.status, body.code ?? UNKNOWN_ERROR_CODE, body.message ?? '요청을 처리하지 못했어요.');
  }
  return body.data;
};

/**
 * 백엔드 API 호출용 클라이언트
 * - 응답의 { success, code, message, data } 를 풀어서 data 만 반환
 * - 로그인이 필요한 요청에 Authorization: Bearer 토큰 자동 첨부
 * - access token 이 만료되면 refresh token 으로 재발급 후 한 번 다시 시도
 */
export const createHttpClient = ({ baseUrl, tokenStore, onSessionExpired }: HttpClientConfig) => {
  // 동시에 여러 요청이 만료되어도 재발급은 한 번만 하도록 진행 중인 재발급을 공유
  let reissuePromise: Promise<string | null> | null = null;

  const send = async <T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> => {
    const { body, query, auth = true } = options;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    if (auth) {
      const accessToken = await tokenStore.getAccessToken();
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    }

    let response: Response;
    try {
      response = await fetch(buildUrl(baseUrl, path, query), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        // API 는 리다이렉트하지 않는다. 리다이렉트 응답이 오면 따라가지 않고 실패로 처리해서
        // 토큰이 담긴 요청이 의도하지 않은 주소로 다시 전송되는 일을 막는다
        redirect: 'error',
      });
    } catch {
      throw new ApiError(0, NETWORK_ERROR_CODE, '네트워크 연결을 확인해 주세요.');
    }

    return parseResponse<T>(response);
  };

  const reissueAccessToken = async (): Promise<string | null> => {
    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) return null;

    try {
      // 재발급할 때마다 refresh token 도 새로 온다 (rotation). 예전 것은 서버에서 폐기되므로 둘 다 저장해야 한다
      const tokens = await send<AuthTokens>('POST', TOKEN_REISSUE_PATH, {
        body: { refreshToken },
        auth: false,
      });
      await tokenStore.setTokens(tokens);
      return tokens.accessToken;
    } catch (reissueError) {
      // refresh token 자체가 거절됨 (만료, 로그아웃·비밀번호 변경으로 폐기) → 다시 로그인해야 함
      if (reissueError instanceof ApiError && isRefreshRejected(reissueError)) return null;
      // 네트워크 끊김, 서버 일시 오류 등 → 멀쩡한 토큰을 지우지 않고 에러만 전달
      throw reissueError;
    }
  };

  const expireSession = async () => {
    await tokenStore.clear();
    onSessionExpired?.();
  };

  const request = async <T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> => {
    try {
      return await send<T>(method, path, options);
    } catch (error) {
      const isAuthRequest = options.auth !== false;
      if (isAuthRequest && error instanceof ApiError && isSessionInvalid(error)) {
        await expireSession();
        throw error;
      }
      const canRetry = isAuthRequest && error instanceof ApiError && isAccessTokenExpired(error);
      if (!canRetry) throw error;

      reissuePromise ??= reissueAccessToken().finally(() => {
        reissuePromise = null;
      });
      // 재발급이 일시적인 이유로 실패하면 여기서 그 에러가 그대로 던져지고, 토큰은 유지된다
      const newAccessToken = await reissuePromise;

      // refresh token 이 없거나 거절됨 → 세션 종료
      if (!newAccessToken) {
        await expireSession();
        throw error;
      }

      // 재시도는 한 번만. 새 토큰으로도 거절되면 (탈퇴, 강제 로그아웃 등) 세션을 끝낸다
      try {
        return await send<T>(method, path, options);
      } catch (retryError) {
        if (retryError instanceof ApiError && (isAccessTokenExpired(retryError) || isSessionInvalid(retryError))) {
          await expireSession();
        }
        throw retryError;
      }
    }
  };

  return {
    get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, options),
    post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
      request<T>('POST', path, { ...options, body }),
    put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
      request<T>('PUT', path, { ...options, body }),
    patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
      request<T>('PATCH', path, { ...options, body }),
    delete: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('DELETE', path, options),
  };
};

export type HttpClient = ReturnType<typeof createHttpClient>;
