'use client';

import { useContext } from 'react';

import { MypagePreviewContext } from '@/components/mypage/MypagePreviewProvider';

export const useMypagePreview = () => {
  const value = useContext(MypagePreviewContext);
  if (!value) throw new Error('useMypagePreview는 MypagePreviewProvider 안에서 사용해야 합니다.');
  return value;
};
