import { ApiError, isApiError } from '../../shared/http/ApiError';
import type { SignupInput, SignupRepository } from './SignupRepository';

export const SIGNUP_ERROR_CODES = {
  invalidInput: 'COMMON_002',
  emailTaken: 'AUTH_006',
  nicknameTaken: 'AUTH_007',
  passwordMismatch: 'AUTH_008',
  codeMismatch: 'AUTH_021',
  codeExpired: 'AUTH_022',
  codeAttemptsExceeded: 'AUTH_023',
  resendCooldown: 'AUTH_024',
  rateLimited: 'AUTH_025',
  verificationExpired: 'AUTH_026',
} as const;

export type SignupDetails = Omit<SignupInput, 'verificationToken' | 'nickname'>;
export type SignupState = {
  email: string;
  nickname: string;
  emailVerified: boolean;
  nicknameAvailable: boolean | null;
  pending: 'sendCode' | 'verifyCode' | 'checkNickname' | 'signup' | null;
  error: ApiError | null;
  completed: boolean;
};

const INITIAL_STATE: SignupState = {
  email: '', nickname: '', emailVerified: false, nicknameAvailable: null,
  pending: null, error: null, completed: false,
};

const NICKNAME_PATTERN = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9._]{2,20}$/;

/** 화면과 분리된 가입 흐름. 인증 토큰은 이 인스턴스의 메모리에만 보관한다. */
export const createSignupFlow = (repository: SignupRepository, now = Date.now) => {
  let state = { ...INITIAL_STATE };
  let verificationToken: string | null = null;
  let verificationExpiresAt = 0;
  let revision = 0;
  const listeners = new Set<() => void>();
  const update = (patch: Partial<SignupState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };
  const clearVerification = () => {
    verificationToken = null;
    verificationExpiresAt = 0;
  };
  const invalid = (message: string, code: string = SIGNUP_ERROR_CODES.invalidInput): never => {
    throw new ApiError(400, code, message);
  };
  const run = async (pending: NonNullable<SignupState['pending']>, action: () => Promise<void>) => {
    // 연속 클릭에 의한 발송/가입 중복 요청을 막는다.
    if (state.pending) return false;
    const requestRevision = revision;
    update({ pending, error: null });
    try {
      await action();
      return requestRevision === revision;
    } catch (error) {
      if (requestRevision === revision) {
        const apiError = isApiError(error) ? error : new ApiError(0, 'UNKNOWN_ERROR', '잠시 후 다시 시도해 주세요.');
        if (apiError.code === SIGNUP_ERROR_CODES.verificationExpired) {
          clearVerification();
          update({ emailVerified: false });
        }
        if (apiError.code === SIGNUP_ERROR_CODES.codeExpired || apiError.code === SIGNUP_ERROR_CODES.codeAttemptsExceeded) {
          clearVerification();
          update({ emailVerified: false });
        }
        if (apiError.code === SIGNUP_ERROR_CODES.nicknameTaken) update({ nicknameAvailable: false });
        update({ error: apiError });
      }
      return false;
    } finally {
      update({ pending: null });
    }
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    setEmail: (email: string) => {
      if (state.pending === 'signup') return;
      if (state.email === email) return;
      revision++;
      clearVerification();
      update({ email, emailVerified: false, error: null, completed: false });
    },
    setNickname: (nickname: string) => {
      if (state.pending === 'signup') return;
      nickname = nickname.toLowerCase();
      if (state.nickname === nickname) return;
      revision++;
      update({ nickname, nicknameAvailable: null, error: null, completed: false });
    },
    sendCode: () => run('sendCode', async () => {
      const email = state.email;
      const requestRevision = revision;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid('이메일 주소를 확인해 주세요.');
      await repository.sendEmailCode(email);
      if (requestRevision !== revision) return;
      clearVerification();
      update({ emailVerified: false });
    }),
    verifyCode: (code: string) => run('verifyCode', async () => {
      const email = state.email;
      const requestRevision = revision;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid('이메일 주소를 확인해 주세요.');
      if (!/^\d{6}$/.test(code)) invalid('인증번호 6자리를 입력해 주세요.');
      const result = await repository.verifyEmailCode(email, code);
      if (requestRevision !== revision) return;
      if (!result.verificationToken) invalid('이메일 인증을 다시 진행해 주세요.', SIGNUP_ERROR_CODES.verificationExpired);
      verificationToken = result.verificationToken;
      verificationExpiresAt = now() + 30 * 60 * 1000;
      update({ emailVerified: true });
    }),
    checkNickname: () => run('checkNickname', async () => {
      const nickname = state.nickname;
      const requestRevision = revision;
      if (!NICKNAME_PATTERN.test(nickname)) {
        invalid('아이디는 2~20자의 영문 소문자, 숫자, 마침표, 밑줄만 사용할 수 있고 마침표로 시작·끝나거나 연속할 수 없어요.');
      }
      const result = await repository.checkNickname(nickname);
      if (requestRevision === revision) update({ nicknameAvailable: result.available });
    }),
    submit: (details: SignupDetails) => run('signup', async () => {
      const requestRevision = revision;
      const token = verificationToken;
      if (state.completed) invalid('이미 회원가입이 완료되었습니다. 로그인해 주세요.');
      if (!token || now() >= verificationExpiresAt) {
        return invalid('이메일 인증을 다시 진행해 주세요.', SIGNUP_ERROR_CODES.verificationExpired);
      }
      if (state.nicknameAvailable !== true) invalid('아이디 중복 확인을 진행해 주세요.');
      if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(details.password)) {
        invalid('비밀번호는 8자 이상 영문, 숫자, 특수문자를 조합해 주세요.');
      }
      if (new TextEncoder().encode(details.password).byteLength > 72) {
        invalid('비밀번호는 UTF-8 기준 72바이트 이하로 입력해 주세요.');
      }
      if (details.password !== details.passwordConfirm) invalid('비밀번호가 일치하지 않습니다.', SIGNUP_ERROR_CODES.passwordMismatch);
      if (!details.termsAgreed || !details.age14Confirmed) invalid('필수 약관 동의와 만 14세 이상 확인이 필요합니다.');
      // 가입 성공은 로그인 세션을 생성하지 않는다. 화면에서 로그인 화면으로 이동한다.
      await repository.signup({ ...details, nickname: state.nickname, verificationToken: token });
      if (requestRevision !== revision) return;
      clearVerification();
      update({ emailVerified: false, completed: true });
    }),
  };
};
