'use client';

import { useContext } from 'react';

import { GiftDraftContext } from '@/components/write/GiftDraftProvider';

export const useGiftDraft = () => {
  const value = useContext(GiftDraftContext);
  if (!value) throw new Error('useGiftDraft는 GiftDraftProvider 안에서 사용해야 합니다.');
  return value;
};
