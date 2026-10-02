import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { AppFrame } from '@/components/layout/AppFrame';

// Pretendard 가변 폰트 (굵기 45~920 을 파일 하나로 지원)
const pretendard = localFont({
  src: './fonts/pretendard-variable.woff2',
  variable: '--font-pretendard-loaded',
  weight: '45 920',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Funzy',
  description: '소중한 사람에게 마음을 전하는 편지',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <html lang="ko" className={`${pretendard.variable} ${inter.variable}`}>
      <body>
        <AppFrame>
          <AuthProvider>{children}</AuthProvider>
        </AppFrame>
      </body>
    </html>
  );
};

export default RootLayout;
