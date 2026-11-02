'use client';

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type PreviewNotifications = { push: boolean; letter: boolean; reaction: boolean; comment: boolean };
export type PreviewConnection = 'google' | 'naver' | 'kakao';

const usePreviewValue = () => {
  const [profile, setProfile] = useState({ name: 'FunFun', loginId: 'funfun', email: 'preview@example.com' });
  const [notifications, setNotifications] = useState<PreviewNotifications>({ push: true, letter: false, reaction: false, comment: false });
  const [connections, setConnections] = useState<Record<PreviewConnection, boolean>>({ google: false, naver: false, kakao: false });
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPending, setPhotoPending] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const ownedPhoto = useRef<string | null>(null);
  const photoVersion = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (ownedPhoto.current) URL.revokeObjectURL(ownedPhoto.current);
    };
  }, []);

  const resetPhoto = useCallback(() => {
    photoVersion.current++;
    if (ownedPhoto.current) URL.revokeObjectURL(ownedPhoto.current);
    ownedPhoto.current = null;
    setPhoto(null); setPhotoPending(false); setPhotoError(null);
  }, []);

  const selectPhoto = useCallback(async (file: File) => {
    const version = ++photoVersion.current;
    setPhotoError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoPending(false); setPhotoError('JPG, PNG, WebP 사진을 선택해 주세요.'); return;
    }
    if (file.size > 5 * 1024 * 1024) { setPhotoPending(false); setPhotoError('5MB 이하의 사진을 선택해 주세요.'); return; }
    setPhotoPending(true);
    const candidate = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => image.naturalWidth ? resolve() : reject(new Error('사진을 읽을 수 없어요.'));
        image.onerror = () => reject(new Error('사진을 읽을 수 없어요. 다른 사진을 선택해 주세요.'));
        image.src = candidate;
      });
      if (!mounted.current || version !== photoVersion.current) { URL.revokeObjectURL(candidate); return; }
      if (ownedPhoto.current) URL.revokeObjectURL(ownedPhoto.current);
      ownedPhoto.current = candidate;
      setPhoto(candidate);
    } catch (cause) {
      URL.revokeObjectURL(candidate);
      if (mounted.current && version === photoVersion.current) setPhotoError(cause instanceof Error ? cause.message : '사진을 읽을 수 없어요.');
    } finally {
      if (mounted.current && version === photoVersion.current) setPhotoPending(false);
    }
  }, []);

  return useMemo(() => ({ profile, setProfile, notifications, setNotifications, connections, setConnections,
    photo, photoPending, photoError, selectPhoto, resetPhoto }),
  [profile, notifications, connections, photo, photoPending, photoError, selectPhoto, resetPhoto]);
};

export const MypagePreviewContext = createContext<ReturnType<typeof usePreviewValue> | null>(null);
export const MypagePreviewProvider = ({ children }: { children: ReactNode }) => {
  const value = usePreviewValue();
  return <MypagePreviewContext.Provider value={value}>{children}</MypagePreviewContext.Provider>;
};
