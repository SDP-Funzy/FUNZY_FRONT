export const SHARED_LETTER_PATH = '/letters/shared';

export const getSafeSharedReturnTo = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.startsWith(`${SHARED_LETTER_PATH}/`)) return null;
  try {
    const parsed = new URL(value, 'https://funzy.invalid');
    if (parsed.origin !== 'https://funzy.invalid' || !/^\/letters\/shared\/[A-Za-z0-9._~-]{1,256}$/.test(parsed.pathname)) return null;
    const card = parsed.searchParams.get('card');
    return parsed.pathname + (card && /^[A-Za-z0-9_-]{1,80}$/.test(card) ? `?card=${encodeURIComponent(card)}` : '');
  } catch { return null; }
};

export const authPathWithReturn = (path: '/login' | '/signup', returnTo?: string | null) => {
  const safe = getSafeSharedReturnTo(returnTo);
  return safe ? `${path}?next=${encodeURIComponent(safe)}` : path;
};
