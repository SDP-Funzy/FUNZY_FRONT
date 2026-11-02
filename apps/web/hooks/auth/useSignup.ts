'use client';

import { createHttpSignupRepository, createSignupFlow } from '@sdp/core';
import { useState, useSyncExternalStore } from 'react';

import { apiClient } from '@/lib/apiClient';

/** 회원가입 화면의 입력·요청 상태. 요청 성공 여부는 boolean으로 반환한다. */
export const useSignup = () => {
  const [flow] = useState(() => createSignupFlow(createHttpSignupRepository(apiClient)));
  const state = useSyncExternalStore(flow.subscribe, flow.getSnapshot, flow.getSnapshot);

  return { ...state, setEmail: flow.setEmail, setNickname: flow.setNickname,
    sendCode: flow.sendCode, verifyCode: flow.verifyCode,
    checkNickname: flow.checkNickname, submit: flow.submit,
    getSnapshot: flow.getSnapshot, clearError: flow.clearError };
};
