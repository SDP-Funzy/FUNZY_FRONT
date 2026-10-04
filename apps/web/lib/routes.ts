/**
 * 화면 주소 모음
 * 아직 화면이 없는 주소(write, mypage, notifications)는 해당 이슈에서 만들 예정
 */
export const ROUTES = {
  home: '/home',
  login: '/login',
  onboarding: '/onboarding',
  signup: '/signup',
  write: '/write',
  writePreview: '/write/preview',
  writeSent: '/write/sent',
  mypage: '/mypage',
  notifications: '/notifications',
} as const;