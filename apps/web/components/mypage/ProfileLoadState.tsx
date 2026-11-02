'use client';
import { Button } from '@/components/ui/Button';
import { letterFailure } from '@/lib/letterService';
export const ProfileLoadState = ({ error, reload }: { error: unknown; reload: () => void }) => <div className="px-page py-[32px] text-center text-14">
  {error ? <><p role="alert" className="text-error">{letterFailure(error)}</p><Button className="mt-[16px]" onClick={reload}>다시 불러오기</Button></> : <p role="status" className="text-gray-m-500">프로필을 불러오고 있어요.</p>}
</div>;
