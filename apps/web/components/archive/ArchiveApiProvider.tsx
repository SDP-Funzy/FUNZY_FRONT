'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useApiResource } from '@/hooks/common/useApiResource';
import { archiveRepository } from '@/lib/archiveService';
import { isApiError } from '@sdp/core';
const useArchiveValue = (memberId?: number) => {
  const loader = useCallback(() => memberId === undefined ? archiveRepository.home() : archiveRepository.friendHome(memberId), [memberId]);
  const resource = useApiResource(`archive-home:${memberId ?? 'self'}`, loader);
  const [category, setCategory] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const denied = isApiError(resource.error) && [401, 403, 404].includes(resource.error.status);
  return { ...resource, data: denied ? null : resource.data, category, setCategory, zoom, setZoom, readOnly: memberId !== undefined, baseHref: memberId === undefined ? '/archive' : `/friends/${memberId}` };
};
const ArchiveApiContext = createContext<ReturnType<typeof useArchiveValue> | null>(null);
export const ArchiveApiProvider = ({ children, memberId }: { children: ReactNode; memberId?: number }) => <ArchiveApiContext.Provider value={useArchiveValue(memberId)}>{children}</ArchiveApiContext.Provider>;
export const useArchiveApi = () => {
  const value = useContext(ArchiveApiContext);
  if (!value) throw new Error('ArchiveApiProvider가 필요합니다.');
  return value;
};
