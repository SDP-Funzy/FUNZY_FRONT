'use client';
import { useCallback } from 'react';
import { useApiResource } from '@/hooks/common/useApiResource';
import { useLetterboxApi } from '@/components/letterbox/LetterboxApiProvider';
import { letterRepository, letterRouteId } from '@/lib/letterService';

export const useServerLetter = (id: string) => {
  const { store } = useLetterboxApi();
  const loader = useCallback(async (signal: AbortSignal) => {
    const letter = await letterRepository.get(letterRouteId(id));
    if (!signal.aborted) store.markRead(letter.letterId);
    return letter;
  }, [id, store]);
  return useApiResource(`letter:${id}`, loader);
};
