'use client';
import { createProfilePhotoUpload, isApiError, validateProfileNickname } from '@sdp/core';
import type { MemberProfile } from '@sdp/core';
import { useEffect, useRef, useState } from 'react';
import { profileRepository, uploadProfilePhoto, validateProfileImageFile } from '@/lib/profileService';

type EditKind = 'photo' | 'reset' | 'nickname';
type EditState = { pending: EditKind | null; error: unknown; errorKind: EditKind | null; message: string; canRetryPhoto: boolean };
const saveProfileField = async (save: () => Promise<void>, updated: MemberProfile, matches: (current: MemberProfile) => boolean, signal: AbortSignal) => {
  try { await save(); }
  catch (error) {
    // 서버 저장 후 응답만 유실됐을 수 있으므로 안전한 조회로 결과를 확인한다.
    if (isApiError(error) && (error.status === 0 || error.status >= 500) && !signal.aborted) {
      try { const current = await profileRepository.profile(); if (matches(current)) return current; } catch { /* 원래 저장 오류를 안내한다. */ }
    }
    throw error;
  }
  return updated;
};
export const useProfileChanges = (profile: { data: MemberProfile | null; replace: (data: MemberProfile) => void }, authenticated: boolean) => {
  const [state, setState] = useState<EditState>({ pending: null, error: null, errorKind: null, message: '', canRetryPhoto: false });
  const busy = useRef(false); const mounted = useRef(true); const active = useRef<AbortController | null>(null);
  const photo = useRef<{ file: File; flow: ReturnType<typeof createProfilePhotoUpload> } | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; active.current?.abort(); photo.current = null; }; }, []);
  useEffect(() => { if (!authenticated) active.current?.abort(); }, [authenticated]);
  const perform = async (kind: EditKind, operation: (base: MemberProfile, signal: AbortSignal) => Promise<MemberProfile>, message: string) => {
    if (busy.current || !profile.data || !authenticated) return false;
    busy.current = true;
    const controller = new AbortController(); active.current = controller;
    setState({ pending: kind, error: null, errorKind: null, message: '', canRetryPhoto: false });
    try {
      const updated = await operation(profile.data, controller.signal);
      if (!mounted.current || controller.signal.aborted) return false;
      profile.replace(updated); photo.current = null;
      setState({ pending: null, error: null, errorKind: null, message, canRetryPhoto: false }); return true;
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) setState({ pending: null, error, errorKind: kind, message: '', canRetryPhoto: kind === 'photo' && photo.current !== null });
      return false;
    } finally { busy.current = false; if (active.current === controller) active.current = null; }
  };
  const changePhoto = (file: File) => perform('photo', async (_base, signal) => {
    if (photo.current && photo.current.file !== file) photo.current = null;
    await validateProfileImageFile(file);
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (photo.current?.file !== file) photo.current = { file, flow: createProfilePhotoUpload(profileRepository, uploadProfilePhoto) };
    return photo.current.flow.send({ type: file.type, size: file.size, body: file }, signal);
  }, '프로필 사진을 변경했어요.');
  return {
    ...state,
    changePhoto,
    retryPhoto: () => photo.current ? changePhoto(photo.current.file) : Promise.resolve(false),
    resetPhoto: () => perform('reset', (base, signal) => saveProfileField(() => profileRepository.resetImage(), { ...base, profileImageUrl: null }, current => current.profileImageUrl === null, signal), '기본 프로필 이미지로 변경했어요.'),
    changeNickname: (input: string) => perform('nickname', async (base, signal) => { const nickname = validateProfileNickname(input); return saveProfileField(() => profileRepository.changeNickname(nickname), { ...base, nickname }, current => current.nickname === nickname, signal); }, '아이디를 변경했어요. 다음 로그인부터 변경된 아이디를 사용해 주세요.'),
    clearNicknameError: () => setState(current => current.errorKind === 'nickname' ? { ...current, error: null, errorKind: null, message: '' } : current),
  };
};
