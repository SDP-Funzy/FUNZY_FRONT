'use client';
import { createContext, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useApiResource } from '@/hooks/common/useApiResource';
import { profileRepository } from '@/lib/profileService';

const useMypageValue = () => {
  const { status } = useAuth();
  const loadProfile = useCallback(() => profileRepository.profile(), []);
  const loadConnected = useCallback(() => profileRepository.connected(), []);
  const profile = useApiResource(`mypage-profile:${status}`, loadProfile, status === 'authenticated');
  const connected = useApiResource(`mypage-connected:${status}`, loadConnected, status === 'authenticated');
  return { profile, connected };
};
const MypageApiContext = createContext<ReturnType<typeof useMypageValue> | null>(null);
export const MypageApiProvider = ({ children }: { children: ReactNode }) => <MypageApiContext.Provider value={useMypageValue()}>{children}</MypageApiContext.Provider>;
export const useMypageApi = () => {
  const value = useContext(MypageApiContext);
  if (!value) throw new Error('MypageApiProvider가 필요합니다.');
  return value;
};
