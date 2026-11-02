'use client';

import { ApiError, isApiError, UNKNOWN_ERROR_CODE } from '@sdp/core';
import { useRef, useState } from 'react';

/** 연속 클릭을 차단하고 실패 시 오류를 표시한 뒤 재시도할 수 있게 한다. */
export const useRecoveryAction = () => {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [completed, setCompleted] = useState(false);

  const run = async (action: () => Promise<void>) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await action();
      setCompleted(true);
      return true;
    } catch (cause) {
      setError(isApiError(cause) ? cause : new ApiError(0, UNKNOWN_ERROR_CODE, '잠시 후 다시 시도해 주세요.'));
      return false;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return { pending, error, completed, run };
};
