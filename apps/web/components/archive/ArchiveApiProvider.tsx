'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useApiResource } from '@/hooks/common/useApiResource';
import { archiveRepository } from '@/lib/archiveService';
const useArchiveValue = () => {
  const loader = useCallback(() => archiveRepository.home(), []);
  const resource = useApiResource('archive-home', loader);
  const [category, setCategory] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  return { ...resource, category, setCategory, zoom, setZoom };
};
const ArchiveApiContext = createContext<ReturnType<typeof useArchiveValue> | null>(null);
export const ArchiveApiProvider = ({ children }: { children: ReactNode }) => <ArchiveApiContext.Provider value={useArchiveValue()}>{children}</ArchiveApiContext.Provider>;
export const useArchiveApi = () => {
  const value = useContext(ArchiveApiContext);
  if (!value) throw new Error('ArchiveApiProvider가 필요합니다.');
  return value;
};
