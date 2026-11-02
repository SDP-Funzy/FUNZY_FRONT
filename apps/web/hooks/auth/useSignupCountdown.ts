'use client';

import { useEffect, useState } from 'react';

/** 탭을 나갔다 돌아와도 실제 경과 시간을 기준으로 표시한다. */
export const useSignupCountdown = (deadline: number) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
};

export const formatSignupCountdown = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
