import Image from 'next/image';

export const ProfileAvatar = ({ src, large = false }: { src: string | null; large?: boolean }) => (
  <span role="img" aria-label={src ? '프로필 사진 미리보기' : '기본 프로필 이미지'}
    className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-black bg-gray-m-50 ${large ? 'size-[128px]' : 'size-[64px]'}`}>
    {src ? <Image src={src} alt="" fill unoptimized sizes={large ? '128px' : '64px'} className="object-cover" /> : (
      <svg width={large ? 72 : 36} height={large ? 72 : 36} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="17" r="8" fill="#959595" /><path d="M8 43v-4a16 16 0 0 1 32 0v4" fill="#959595" />
      </svg>
    )}
  </span>
);
