import type { MemberProfile, ProfileImageUpload, ProfilePhoto, ProfileRepository } from './Profile';
import { validateProfilePhoto } from './Profile';

/** 업로드 완료 처리만 실패했다면 이미 올린 파일을 다시 업로드하지 않는다. */
export const createProfilePhotoUpload = (repo: Pick<ProfileRepository, 'presignImage' | 'completeImage' | 'profile'>, upload: (target: ProfileImageUpload, photo: ProfilePhoto) => Promise<void>) => {
  let currentBody: unknown;
  let target: ProfileImageUpload | null = null;
  let uploaded = false;
  let completing = false;
  let pending: Promise<MemberProfile> | null = null;
  const run = async (photo: ProfilePhoto, signal?: AbortSignal) => {
    const check = () => { if (signal?.aborted) throw new DOMException('Aborted', 'AbortError'); };
    check();
    validateProfilePhoto(photo);
    if (currentBody !== photo.body) { currentBody = photo.body; target = null; uploaded = false; completing = false; }
    if (completing && target) {
      const profile = await repo.profile();
      check();
      const path = (url: string) => url.split(/[?#]/)[0];
      if (profile.profileImageUrl && path(profile.profileImageUrl) === path(target.imageUrl)) return profile;
    }
    if (!uploaded) {
      if (!target || Date.parse(target.expiresAt) <= Date.now()) target = await repo.presignImage(photo);
      check();
      await upload(target, photo); uploaded = true;
    }
    check();
    completing = true;
    return repo.completeImage(target!.imageKey);
  };
  return { send: (photo: ProfilePhoto, signal?: AbortSignal) => { pending ??= run(photo, signal).finally(() => { pending = null; }); return pending; } };
};
