import Image from 'next/image';

export const FriendAvatar = ({ src, size = 36 }: { src: string | null; size?: number }) => src
  ? <Image src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  : <span aria-hidden="true" className="block shrink-0 rounded-full bg-gray-m-50" style={{ width: size, height: size }} />;
