/** 백엔드 공통 응답 형식: 모든 API 가 이 형태로 감싸서 내려준다 */
export type ApiResponse<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
};
