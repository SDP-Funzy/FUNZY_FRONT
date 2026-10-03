'use client';

import { useContext } from 'react';

import { WriteDraftContext } from '@/components/write/WriteDraftProvider';

/** 작성 중인 편지 내용. /write 화면 안에서만 쓸 수 있다 */
export const useWriteDraft = () => {
  const context = useContext(WriteDraftContext);
  if (!context) throw new Error('useWriteDraft 는 WriteDraftProvider 안에서만 사용할 수 있습니다.');
  return context;
};
