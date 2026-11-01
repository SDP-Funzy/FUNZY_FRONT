export type SignupInput = {
  verificationToken: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
  termsAgreed: boolean;
  age14Confirmed: boolean;
  marketingConsent: boolean;
  adConsent: boolean;
};

export interface SignupRepository {
  sendEmailCode(email: string): Promise<void>;
  verifyEmailCode(email: string, code: string): Promise<{ verificationToken: string }>;
  checkNickname(nickname: string): Promise<{ available: boolean }>;
  signup(input: SignupInput): Promise<void>;
}
