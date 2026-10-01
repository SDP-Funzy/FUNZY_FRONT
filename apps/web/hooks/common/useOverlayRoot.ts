'use client';

import { useEffect, useState } from 'react';

import { OVERLAY_ROOT_ID } from '@/lib/overlay';

/** AppFrame 의 오버레이 영역을 찾아 반환. 서버 렌더 중에는 null */
export const useOverlayRoot = () => {
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setOverlayRoot(document.getElementById(OVERLAY_ROOT_ID));
  }, []);

  return overlayRoot;
};
