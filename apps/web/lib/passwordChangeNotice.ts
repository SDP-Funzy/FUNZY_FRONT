const KEY = 'funzy.passwordChanged';
export const rememberPasswordChange = () => { try { window.sessionStorage.setItem(KEY, '1'); } catch { /* 저장소 사용 불가 시에도 로그아웃은 진행한다. */ } };
export const hasPasswordChangeNotice = () => { try { return typeof window !== 'undefined' && window.sessionStorage.getItem(KEY) === '1'; } catch { return false; } };
export const dismissPasswordChangeNotice = () => { try { window.sessionStorage.removeItem(KEY); } catch { /* 안내를 닫는 동작은 유지한다. */ } };
