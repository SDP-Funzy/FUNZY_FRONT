import type { AuthTokens } from '../../shared/storage/TokenStore';

export type LoginCredentials = {
  /** 아이디 (가입 시 등록한 닉네임) */
  nickname: string;
  password: string;
};

/**
 * 인증 관련 서버 기능 중 유스케이스가 필요로 하는 것
 * 실제 구현은 infra (HttpAuthRepository) 가 하고, application 은 이 인터페이스만 안다.
 * 회원가입은 회원가입 API 연동 이슈에서 추가 예정
 */
export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthTokens>;
  /** 이 기기의 세션 종료 */
  logout(refreshToken: string): Promise<void>;
}
