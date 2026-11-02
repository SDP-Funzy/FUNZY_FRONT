/**
 * 화면 주소 모음
 * 각 화면에서는 이 주소를 재사용한다.
 */
export const ROUTES = {
  home: '/home',
  letterbox: '/letterbox',
  archive: '/archive',
  login: '/login',
  passwordForgot: '/password/forgot',
  passwordReset: '/password/reset',
  accountUnlockRequest: '/account/unlock-request',
  accountUnlock: '/account/unlock',
  onboarding: '/onboarding',
  signup: '/signup',
  write: '/write',
  writeGift: '/write/gift',
  writePreview: '/write/preview',
  writeSent: '/write/sent',
  mypage: '/mypage',
  mypageProfile: '/mypage/profile',
  mypagePassword: '/mypage/password',
  mypageConnections: '/mypage/connections',
  mypageNotifications: '/mypage/notifications',
  mypagePolicies: '/mypage/policies',
  notifications: '/notifications',
} as const;
