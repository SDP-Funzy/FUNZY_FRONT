import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // packages/core 는 빌드 없이 TypeScript 원본을 그대로 내보내므로 Next 가 직접 변환하도록 지정
  transpilePackages: ['@sdp/core'],
};

export default nextConfig;
