'use client';

import { createContext, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { createGiftDraft, giftDraftReducer, isGiftCardWritten, MIN_GIFT_CARDS } from '@/lib/giftDraft';
import type { GiftStroke } from '@/lib/giftDraft';

export type GiftPhoto = { file: File; url: string };

const useGiftDraftValue = () => {
  const [state, dispatch] = useReducer(giftDraftReducer, undefined, createGiftDraft);
  const [photos, setPhotos] = useState<Record<string, GiftPhoto>>({});
  const photosRef = useRef(photos);
  const idCounter = useRef(2);

  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => () => { Object.values(photosRef.current).forEach(photo => URL.revokeObjectURL(photo.url)); }, []);

  const setPhoto = useCallback((id: string, photo: GiftPhoto) => {
    const previous = photosRef.current[id];
    if (previous) URL.revokeObjectURL(previous.url);
    const next = { ...photosRef.current, [id]: photo };
    photosRef.current = next;
    setPhotos(next);
  }, []);

  const removePhoto = useCallback((id: string) => {
    const photo = photosRef.current[id];
    if (!photo) return;
    URL.revokeObjectURL(photo.url);
    const next = { ...photosRef.current };
    delete next[id];
    photosRef.current = next;
    setPhotos(next);
  }, []);

  const add = useCallback(() => { dispatch({ type: 'add', id: `gift-${idCounter.current++}` }); }, []);
  const select = useCallback((index: number) => dispatch({ type: 'select', index }), []);
  const appendStroke = useCallback((id: string, stroke: GiftStroke) => dispatch({ type: 'stroke', id, stroke }), []);
  const undo = useCallback((id: string) => dispatch({ type: 'undo', id }), []);
  const clear = useCallback((id: string) => dispatch({ type: 'clear', id }), []);
  const remove = useCallback((id: string) => {
    if (state.cards.length <= MIN_GIFT_CARDS) return;
    removePhoto(id);
    dispatch({ type: 'remove', id });
  }, [state.cards.length, removePhoto]);
  const reset = useCallback(() => {
    Object.values(photosRef.current).forEach(photo => URL.revokeObjectURL(photo.url));
    photosRef.current = {};
    setPhotos({});
    dispatch({ type: 'reset' });
  }, []);

  const writtenCount = state.cards.filter(card => isGiftCardWritten(card, Boolean(photos[card.id]))).length;
  return useMemo(() => ({
    ...state, photos, currentCard: state.cards[state.index]!, writtenCount,
    hasContent: writtenCount > 0, isComplete: writtenCount === state.cards.length,
    setPhoto, removePhoto, add, select, appendStroke, undo, clear, remove, reset,
  }), [state, photos, writtenCount, setPhoto, removePhoto, add, select, appendStroke, undo, clear, remove, reset]);
};

export const GiftDraftContext = createContext<ReturnType<typeof useGiftDraftValue> | null>(null);
export const GiftDraftProvider = ({ children }: { children: ReactNode }) => {
  const value = useGiftDraftValue();
  return <GiftDraftContext.Provider value={value}>{children}</GiftDraftContext.Provider>;
};
