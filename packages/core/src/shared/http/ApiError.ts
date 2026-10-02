/** 서버가 실패로 응답했을 때 화면에서 구분할 수 있도록 상태 코드와 에러 코드를 담는다 */
export class ApiError extends Error {
  readonly status: number;
  /** 백엔드 에러 코드. 예: AUTH_001 (아이디·비밀번호 불일치), AUTH_010 (계정 잠김) */
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** 서버에 닿지 못했을 때 (네트워크 끊김, 서버 꺼짐, CORS 차단 등) */
export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

/** 응답이 공통 형식이 아닐 때 */
export const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
