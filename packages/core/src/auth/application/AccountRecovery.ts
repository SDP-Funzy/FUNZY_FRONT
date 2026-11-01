import { ApiError } from '../../shared/http/ApiError';
import type { TokenStore } from '../../shared/storage/TokenStore';

export type PasswordResetInput = {
  token: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export interface AccountRecoveryRepository {
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(input: PasswordResetInput): Promise<void>;
  requestAccountUnlock(email: string): Promise<void>;
  unlockAccount(token: string): Promise<void>;
}

export const RECOVERY_ERROR_CODES = {
  invalidInput: 'COMMON_002',
  passwordMismatch: 'AUTH_008',
  invalidLink: 'AUTH_011',
  samePassword: 'AUTH_028',
  memberMissing: 'AUTH_002',
} as const;

/** 이 오류 이후에는 비밀번호를 바꿔 재시도하지 않고 새 메일을 요청한다. */
export const recoveryNeedsNewLink = (code: string) =>
  code === RECOVERY_ERROR_CODES.invalidLink ||
  code === RECOVERY_ERROR_CODES.samePassword ||
  code === RECOVERY_ERROR_CODES.memberMissing;

const validateEmail = (email: string) => {
  const value = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new ApiError(400, RECOVERY_ERROR_CODES.invalidInput, '이메일 주소를 확인해 주세요.');
  }
  return value;
};

const validateToken = (token: string) => {
  if (!token.trim()) {
    throw new ApiError(400, RECOVERY_ERROR_CODES.invalidLink, '유효하지 않거나 만료된 링크입니다. 메일을 다시 요청해 주세요.');
  }
};

/** 메일 요청은 계정 존재 여부와 무관하게 같은 성공 결과로 처리한다. */
export const makeAccountRecovery = (repository: AccountRecoveryRepository, tokenStore: Pick<TokenStore, 'clear'>) => ({
  requestPasswordReset: (email: string) => repository.requestPasswordReset(validateEmail(email)),
  requestAccountUnlock: (email: string) => repository.requestAccountUnlock(validateEmail(email)),
  resetPassword: async (input: PasswordResetInput) => {
    validateToken(input.token);
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(input.newPassword)) {
      throw new ApiError(400, RECOVERY_ERROR_CODES.invalidInput, '비밀번호는 8자 이상 영문, 숫자, 특수문자를 조합해 주세요.');
    }
    if (new TextEncoder().encode(input.newPassword).byteLength > 72) {
      throw new ApiError(400, RECOVERY_ERROR_CODES.invalidInput, '비밀번호는 UTF-8 기준 72바이트 이하로 입력해 주세요.');
    }
    if (input.newPassword !== input.newPasswordConfirm) {
      throw new ApiError(400, RECOVERY_ERROR_CODES.passwordMismatch, '비밀번호가 일치하지 않습니다.');
    }
    await repository.resetPassword(input);
    // 서버도 모든 세션을 종료한다. 이 기기의 저장된 세션도 지운다.
    await tokenStore.clear();
  },
  unlockAccount: async (token: string) => {
    validateToken(token);
    await repository.unlockAccount(token);
    await tokenStore.clear();
  },
});
