'use client';
import type { Letter } from '@sdp/core';
import { useRef, useState } from 'react';
import { useLetterboxApi } from '@/components/letterbox/LetterboxApiProvider';
import { letterFailure, letterRepository } from '@/lib/letterService';

export const useLetterKok = (letter: Letter, replace: (next: Letter) => void) => {
  const { store } = useLetterboxApi();
  const busy = useRef(false);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async (cardId: number, kok: boolean, locked?: boolean) => {
    if (busy.current) return;
    busy.current = true; setPending(cardId); setError(null);
    try { await letterRepository.setKok(cardId, kok, locked); replace(await letterRepository.get(letter.letterId)); void store.reload(); }
    catch (cause) { setError(letterFailure(cause)); }
    finally { busy.current = false; setPending(null); }
  };
  return { pending, error, setError, run };
};
